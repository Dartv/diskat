export class MarkdownFormatter {
  static italic(text: string): string {
    return `*${text}*`;
  }

  static bold(text: string): string {
    return `**${text}**`;
  }

  static strikeout(text: string): string {
    return `~~${text}~~`;
  }

  static underline(text: string): string {
    return `__${text}__`;
  }

  static code(text: string): string {
    return `\`\`${text}\`\``;
  }

  static codeBlock(text: string, syntax = ''): string {
    return `\`\`\`${syntax}\n${text}\n\`\`\``;
  }
}
