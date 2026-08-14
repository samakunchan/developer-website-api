import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { ProfilesModule } from './profiles/profiles.module';
import { MessagesModule } from './messages/messages.module';
import { ProjectsModule } from './projects/projects.module';
import { DocumentsModule } from './documents/documents.module';
import { AccountModule } from './account/account.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SettingsModule,
    ProfilesModule,
    MessagesModule,
    ProjectsModule,
    DocumentsModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
