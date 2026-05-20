import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface CaptchaSession {
  answer: string;
  createdAt: Date;
  attempts: number;
}

@Injectable()
export class CaptchaService {
  // Simple in-memory store (in production, use Redis or database)
  private captchaSessions: Map<string, CaptchaSession> = new Map();
  private readonly EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 5;

  /**
   * Generate a simple math captcha
   * Returns captcha ID and image data (SVG format)
   */
  generateCaptcha(): {
    captchaId: string;
    image: string;
    question: string;
  } {
    const num1 = Math.floor(Math.random() * 50) + 1; // 1-50
    const num2 = Math.floor(Math.random() * 50) + 1; // 1-50
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let answer: number;
    switch (operation) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      default:
        answer = 0;
    }

    const captchaId = randomBytes(16).toString('hex');
    const question = `${num1} ${operation} ${num2}`;

    // Store the answer
    this.captchaSessions.set(captchaId, {
      answer: answer.toString(),
      createdAt: new Date(),
      attempts: 0
    });

    // Clean up expired captchas
    this.cleanupExpiredCaptchas();

    // Generate SVG image
    const image = this.generateSvgImage(question);

    return {
      captchaId,
      image,
      question
    };
  }

  /**
   * Verify captcha answer
   */
  verifyCaptcha(captchaId: string, answer: string): boolean {
    const session = this.captchaSessions.get(captchaId);

    if (!session) {
      return false;
    }

    // Check if expired
    if (Date.now() - session.createdAt.getTime() > this.EXPIRY_TIME) {
      this.captchaSessions.delete(captchaId);
      return false;
    }

    // Check attempt limit
    if (session.attempts >= this.MAX_ATTEMPTS) {
      this.captchaSessions.delete(captchaId);
      return false;
    }

    session.attempts++;

    // Check answer
    if (session.answer === answer.trim()) {
      this.captchaSessions.delete(captchaId);
      return true;
    }

    return false;
  }

  /**
   * Generate SVG image for captcha
   */
  private generateSvgImage(question: string): string {
    const width = 300;
    const height = 100;
    const fontSize = 48;

    // Add some noise/distortion
    const rotation = (Math.random() - 0.5) * 10;
    const xOffset = (Math.random() - 0.5) * 20;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="#f0f0f0" stroke="#999" stroke-width="2" rx="5"/>
        
        <!-- Background noise lines -->
        ${Array.from({ length: 5 })
          .map(
            () =>
              `<line x1="${Math.random() * width}" y1="${Math.random() * height}" x2="${Math.random() * width}" y2="${Math.random() * height}" stroke="#ddd" stroke-width="1" opacity="0.5"/>`
          )
          .join('')}
        
        <!-- Question text -->
        <text 
          x="${width / 2 + xOffset}" 
          y="${height / 2 + fontSize / 3}" 
          font-size="${fontSize}" 
          font-weight="bold"
          font-family="Arial, sans-serif"
          text-anchor="middle"
          fill="#333"
          transform="rotate(${rotation} ${width / 2} ${height / 2})"
          filter="url(#noise)"
        >
          ${this.escapeHtml(question)}
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Clean up expired captcha sessions
   */
  private cleanupExpiredCaptchas(): void {
    const now = Date.now();
    for (const [id, session] of this.captchaSessions.entries()) {
      if (now - session.createdAt.getTime() > this.EXPIRY_TIME) {
        this.captchaSessions.delete(id);
      }
    }
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
