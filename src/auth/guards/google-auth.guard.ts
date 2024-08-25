import { Injectable, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

/**
 * constructor(private configService: ConfigService) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
            scope: ['profile', 'email']
        });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const activate = await super.canActivate(context) as boolean;
        const request = context.switchToHttp().getRequest();
        await super.logIn(request);
        return activate;
    }
 */