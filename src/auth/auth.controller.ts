import { Body, Controller, Get, Post, Req, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(GoogleAuthGuard)
    @Get('google') // Sign in via the web
    async googleAuth(@Req() req) { }

    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    googleAuthRedirect(@Req() req) {
        console.log('Google Auth Redirect...', req);
        return this.authService.googleLogin(req);
    }

    @Post('mobile/google-signin')
    async googleSignIn(@Body() body: { idToken: string }) {
        console.log('Google Sign In via mobile...', body);
        const { idToken } = body;
        return this.authService.verifyGoogleToken(idToken);
    }

    @Post('refresh-token')
    async refreshToken(@Body() body: { refreshToken: string }) {
        console.log('Refreshing token...', body);
        const { refreshToken } = body;
        return this.authService.refreshToken(refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        console.log('Getting user profile...', req.user)
        return req.user;
    }
}
