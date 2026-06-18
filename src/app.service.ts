import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  getHomeInfos(): Record<string, any> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return {
        name: pkg.name,
        description: pkg.description,
        author: pkg.author,
        version: pkg.version,
        environment: process.env.NODE_ENV || 'notfound',
      };
    } catch {
      return {
        name: 'developer-website-api',
        description: "NestJS API for developer-website. It's an external API connected directly to the website.",
        author: 'Samakunchan',
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'notfound',
        errorMessage: 'Failed to load informations. Got the default one.',
      };
    }
  }
}
