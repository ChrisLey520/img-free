import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { readFile } from 'fs/promises';
import path from 'path';

type ConvertSuccessBody = {
  output?: {
    mime?: string;
    width?: number;
    height?: number;
    dataUrl?: string;
    gamePayload?: {
      layout: string;
      width: number;
      height: number;
      palette: string[];
      indices: number[];
    };
  };
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/convert (POST) svg->png', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    const r = await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'png')
      .field('options', JSON.stringify({ pngCompressionLevel: 9 }))
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(201);

    const body = r.body as ConvertSuccessBody;
    expect(body.output?.mime).toBe('image/png');
    expect(typeof body.output?.dataUrl).toBe('string');
    expect(body.output?.dataUrl?.startsWith('data:image/png;base64,')).toBe(
      true,
    );
  });

  it('/convert (POST) svg->png with sprite inside 64x64', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    const r = await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'png')
      .field(
        'options',
        JSON.stringify({
          pngCompressionLevel: 9,
          sprite: { enabled: true, width: 64, height: 64, fit: 'inside' },
        }),
      )
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(201);

    const body = r.body as ConvertSuccessBody;
    expect(body.output?.mime).toBe('image/png');
    expect(body.output?.width).toBe(64);
    expect(body.output?.height).toBe(64);
    expect(body.output?.dataUrl?.startsWith('data:image/png;base64,')).toBe(
      true,
    );
  });

  it('/convert (POST) sprite + jpeg returns 400', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'jpeg')
      .field(
        'options',
        JSON.stringify({
          jpegQuality: 85,
          sprite: { enabled: true, width: 32, height: 32, fit: 'cover' },
        }),
      )
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
  });

  it('/convert (POST) sprite + svg target returns 400', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'svg')
      .field(
        'options',
        JSON.stringify({
          sprite: { enabled: true, width: 32, height: 32, fit: 'inside' },
        }),
      )
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
  });

  it('/convert (POST) sprite + ico returns 400', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'ico')
      .field(
        'options',
        JSON.stringify({
          icoSizes: [16, 32],
          sprite: { enabled: true, width: 32, height: 32, fit: 'inside' },
        }),
      )
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
  });

  it('/convert (POST) sprite with paletteColors', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    const r = await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'png')
      .field(
        'options',
        JSON.stringify({
          pngCompressionLevel: 9,
          sprite: {
            enabled: true,
            width: 48,
            height: 48,
            fit: 'fill',
            paletteColors: 4,
          },
        }),
      )
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(201);

    const body = r.body as ConvertSuccessBody;
    expect(body.output?.mime).toBe('image/png');
    expect(body.output?.width).toBe(48);
    expect(body.output?.height).toBe(48);
  });

  it('/convert (POST) sprite includeGamePayload on 32x32', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    const r = await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'png')
      .field(
        'options',
        JSON.stringify({
          pngCompressionLevel: 9,
          sprite: {
            enabled: true,
            width: 32,
            height: 32,
            fit: 'inside',
            includeGamePayload: true,
          },
        }),
      )
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(201);

    const body = r.body as ConvertSuccessBody;
    const gp = body.output?.gamePayload;
    expect(gp).toBeDefined();
    expect(gp?.layout).toBe('rowMajor');
    expect(gp?.width).toBe(32);
    expect(gp?.height).toBe(32);
    expect(Array.isArray(gp?.palette)).toBe(true);
    expect(gp?.palette?.length).toBeGreaterThan(0);
    expect(gp?.indices?.length).toBe(32 * 32);
  });

  it('/convert (POST) sprite includeGamePayload over cell limit fails Zod', async () => {
    const svgPath = path.resolve(__dirname, '../../web/public/next.svg');
    const svg = await readFile(svgPath);

    await request(app.getHttpServer())
      .post('/convert')
      .field('targetFormat', 'png')
      .field(
        'options',
        JSON.stringify({
          sprite: {
            enabled: true,
            width: 65,
            height: 64,
            fit: 'inside',
            includeGamePayload: true,
          },
        }),
      )
      .attach('input', svg, {
        filename: 'next.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
