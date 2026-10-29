import { createEmailOtpProvider } from '../src/auth/email-otp-provider.factory';

const base = {
  nodeEnv: 'production',
  timeoutMs: 5000,
  resendApiUrl: 'https://api.resend.com/emails',
};

describe('email OTP provider selection', () => {
  it('refuses to log live codes when console is selected in production', () => {
    expect(() =>
      createEmailOtpProvider({ ...base, kind: 'console' }),
    ).toThrow(/refused/);
  });

  it('fails fast when Resend credentials are incomplete', () => {
    expect(() =>
      createEmailOtpProvider({ ...base, kind: 'resend' }),
    ).toThrow(/RESEND_API_KEY/);
  });

  it('fails fast when SMTP has no host', () => {
    expect(() =>
      createEmailOtpProvider({
        ...base,
        kind: 'smtp',
        from: 'Nourish <no-reply@example.com>',
      }),
    ).toThrow(/SMTP_HOST/);
  });

  it('selects the honest unavailable provider when disabled', () => {
    expect(createEmailOtpProvider({ ...base, kind: 'none' }).name).toBe('none');
  });
});
