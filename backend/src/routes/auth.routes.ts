import { Router } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/error-handler.js'
import { authenticateUser, disableTwoFactor, enableTwoFactor, prepareTwoFactor, registerUser, requestPasswordReset, resetPassword, verifyTwoFactorToken } from '../services/auth.service.js'
import { loginSchema, registerSchema, resetPasswordSchema, resetRequestSchema, twoFactorTokenSchema } from '../validation/auth.validation.js'
import { recordActivity } from '../services/activity-log.service.js'

export const authRouter = Router()

authRouter.post('/register', async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body)
    const user = await registerUser(input)
    request.session.userId = user._id.toString()
    await recordActivity({ request, userId: user._id.toString(), action: 'auth.login', metadata: { method: 'register' } })

    response.status(201).json({
      success: true,
      data: { id: user._id, username: user.username, email: user.email, role: user.role, profileImage: user.profileImage },
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/login', async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body)
    const user = await authenticateUser(input.email, input.password)
    if (user.twoFactorEnabled) {
      if (!input.twoFactorToken || !user.twoFactorSecret || !verifyTwoFactorToken(user.twoFactorSecret, input.twoFactorToken)) {
        if (!input.twoFactorToken) { request.session.pendingUserId = user._id.toString(); response.json({ success: true, data: { requiresTwoFactor: true } }); return }
        throw new AppError(401, 'Ogiltig 2FA-kod.')
      }
    }
    request.session.userId = user._id.toString()
    await recordActivity({ request, userId: user._id.toString(), action: 'auth.login', metadata: { method: 'password' } })

    response.json({
      success: true,
      data: { id: user._id, username: user.username, email: user.email, role: user.role, profileImage: user.profileImage },
    })
  } catch (error) {
    next(error)
  }
})

authRouter.post('/logout', requireAuth, (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      next(error)
      return
    }

    response.clearCookie('connect.sid')
    response.status(204).send()
  })
})

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({ success: true, data: request.authenticatedUser })
})

authRouter.post('/2fa/setup', requireAuth, async (request, response, next) => {
  try { response.json({ success: true, data: await prepareTwoFactor(request.authenticatedUser!.id, request.authenticatedUser!.email) }) } catch (error) { next(error) }
})

authRouter.post('/2fa/enable', requireAuth, async (request, response, next) => {
  try { await enableTwoFactor(request.authenticatedUser!.id, twoFactorTokenSchema.parse(request.body).token); response.status(204).send() } catch (error) { next(error) }
})

authRouter.post('/forgot-password', async (request, response, next) => {
  try { await requestPasswordReset(resetRequestSchema.parse(request.body).email); response.json({ success: true, message: 'Om kontot finns skickas instruktioner för återställning.' }) } catch (error) { next(error) }
})

authRouter.post('/reset-password', async (request, response, next) => {
  try { const input = resetPasswordSchema.parse(request.body); await resetPassword(input.token, input.password); response.json({ success: true, message: 'Lösenordet har återställts.' }) } catch (error) { next(error) }
})

authRouter.post('/2fa/disable', requireAuth, async (request, response, next) => {
  try { await disableTwoFactor(request.authenticatedUser!.id, twoFactorTokenSchema.parse(request.body).token); response.status(204).send() } catch (error) { next(error) }
})
