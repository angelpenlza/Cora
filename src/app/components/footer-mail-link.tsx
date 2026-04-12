import Image from 'next/image';

type FooterMailLinkProps = {
  email: string;
};

const SUBJECT = 'Cora';

/** Gmail web compose — works in the browser without a system mailto handler. */
function gmailComposeHref(email: string): string {
  const q = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: email,
    su: SUBJECT,
  });
  return `https://mail.google.com/mail/?${q.toString()}`;
}

export default function FooterMailLink({ email }: FooterMailLinkProps) {
  return (
    <a
      href={gmailComposeHref(email)}
      target="_blank"
      rel="noopener noreferrer"
      className="site-footer-social-btn"
      aria-label={`Email Cora at ${email} (opens Gmail compose in a new tab)`}
      title={`${email} — compose in Gmail (new tab)`}
    >
      <Image
        src="/assets/footer-mail-bubble.png"
        alt=""
        width={40}
        height={40}
        className="site-footer-social-img"
        unoptimized
      />
    </a>
  );
}
