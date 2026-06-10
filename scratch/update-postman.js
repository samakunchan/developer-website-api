import fs from 'fs';
import crypto from 'crypto';

const inputPath =
  '/Users/samakunchan/.gemini/antigravity-ide/brain/171a1a8c-5e1a-4615-8f85-b30fdaa5b1ae/.system_generated/steps/143/output.txt';
const outputPath =
  '/Users/samakunchan/.gemini/antigravity-ide/brain/171a1a8c-5e1a-4615-8f85-b30fdaa5b1ae/scratch/updated-collection.json';

const rawData = fs.readFileSync(inputPath, 'utf8');
const data = JSON.parse(rawData);

const profilesFolder = {
  id: crypto.randomUUID(),
  name: 'Profiles',
  item: [
    {
      id: crypto.randomUUID(),
      name: 'Get Presentation',
      request: {
        auth: {
          type: 'noauth',
        },
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/profiles/presentation',
          host: ['{{baseUrl}}'],
          path: ['profiles', 'presentation'],
        },
      },
      response: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Get Profile',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/profiles',
          host: ['{{baseUrl}}'],
          path: ['profiles'],
        },
      },
      response: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Update Personal Info',
      request: {
        method: 'PUT',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              fullName: 'Cedric Badjah',
              professionalTitle: 'Senior Full Stack Developer',
              bio: 'Passionate about clean code and performance.',
              experience: 10,
              focus: 'TypeScript & Node.js',
              languages: 'French, English',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{baseUrl}}/profiles/personal-info',
          host: ['{{baseUrl}}'],
          path: ['profiles', 'personal-info'],
        },
      },
      response: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Add Tech Stack',
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              name: 'NestJS',
              category: 'backend',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{baseUrl}}/profiles/tech-stack',
          host: ['{{baseUrl}}'],
          path: ['profiles', 'tech-stack'],
        },
      },
      response: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Remove Tech Stack',
      request: {
        method: 'DELETE',
        header: [],
        url: {
          raw: '{{baseUrl}}/profiles/tech-stack/:id',
          host: ['{{baseUrl}}'],
          path: ['profiles', 'tech-stack', ':id'],
          variable: [
            {
              key: 'id',
              value: '1',
            },
          ],
        },
      },
      response: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Add Social Link',
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify(
            {
              name: 'GitHub',
              url: 'https://github.com/samakunchan',
              icon: 'github',
              type: 'github',
            },
            null,
            2,
          ),
          options: {
            raw: {
              language: 'json',
            },
          },
        },
        url: {
          raw: '{{baseUrl}}/profiles/social-link',
          host: ['{{baseUrl}}'],
          path: ['profiles', 'social-link'],
        },
      },
      response: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Remove Social Link',
      request: {
        method: 'DELETE',
        header: [],
        url: {
          raw: '{{baseUrl}}/profiles/social-link/:id',
          host: ['{{baseUrl}}'],
          path: ['profiles', 'social-link', ':id'],
          variable: [
            {
              key: 'id',
              value: '1',
            },
          ],
        },
      },
      response: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Update Avatar',
      request: {
        method: 'POST',
        header: [],
        body: {
          mode: 'formdata',
          formdata: [
            {
              key: 'file',
              type: 'file',
              src: null,
            },
          ],
        },
        url: {
          raw: '{{baseUrl}}/profiles/avatar',
          host: ['{{baseUrl}}'],
          path: ['profiles', 'avatar'],
        },
      },
      response: [],
    },
  ],
};

// Add the new Profiles folder
data.collection.item.push(profilesFolder);

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
console.log(
  'Successfully wrote updated collection JSON with IDs to ' + outputPath,
);
