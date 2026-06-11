import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { ProfilesModule } from './profiles/profiles.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SettingsModule,
    ProfilesModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
