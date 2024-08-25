import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from 'src/users/users.service';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService,
    ) { }

    async validateUser(profile: any): Promise<any> {
        // Implement user validation logic
        return profile;
    }

    async googleLogin(req: any): Promise<any> {
        if (!req.user) {
            console.log('No user from Google');
            return { msg: 'Login failed' };
        }

        const user = await this.validateUser(req.user);
        console.log('User: ', user);
        if (!user) {
            return { msg: 'Invalid credentials' };
        }

        const payload = { email: user.email, sub: user.id };
        return {
            message: 'User information from Google',
            user,
            token: this.jwtService.sign(payload),
        };
    }

    async verifyGoogleToken(idToken: string): Promise<any> {
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            // console.log('Ticket: ', ticket);
            const payload = ticket.getPayload();
            const userEmail = payload.email;

            let user = await this.usersService.user({ email: userEmail });
            let newUser: boolean;

            if (!user) {
                user = await this.usersService.createUser({
                    email: userEmail,
                    username: payload.given_name, // Default username before user sets their email
                    avatar: payload.picture,
                    topics: ["General Knowledge"],
                    // googleId: payload.sub,
                });
                newUser = true;
                console.log('New user created !');
            } else {
                console.log('Existing user found !');
                newUser = false;
            }

            const accessToken = this.jwtService.sign({
                email: user.email,
                sub: user.id,
            });

            const refreshToken = this.jwtService.sign(
                { email: user.email, sub: user.id },
                { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '15d' },
            );

            user = await this.usersService.updateUser({
                where: { id: user.id },
                data: { refreshToken: refreshToken },
            })
            console.log('User updated : ', user);
            
            return { user, accessToken, refreshToken, newUser };
        } catch (error) {
            console.log('Error verifying Google token: ', error);
            return null;
        }
    }

    async refreshToken(oldRefreshToken: string): Promise<any> {
        try {
            const decoded = this.jwtService.verify(oldRefreshToken, {
                secret: process.env.JWT_TOKEN_SECRET,
            });
            const user = this.usersService.user(
                { email: decoded.email },
            );
            if (!user || (await user).refreshToken !== oldRefreshToken) {
                throw new Error('Invalid refresh token');
                // return null;
            }
            const newAccessToken = this.jwtService.sign(
                { email: (await user).email, sub: (await user).id, }
            );

            // Could later implement generating & storing a new refresh token
            /* const newRefreshToken = this.jwtService.sign(
                { email: decoded.email, sub: decoded.sub },
                { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '15d' },
            ); */

            return { newAccessToken };
        } catch (error) {
            console.log('Error refreshing token: ', error);
            throw new Error('Invalid refresh token');
        }
    }
}
