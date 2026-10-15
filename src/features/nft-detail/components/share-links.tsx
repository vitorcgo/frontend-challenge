import shareLinkedin from '@/assets/brands/share-linkedin.svg'
import shareTwitter from '@/assets/brands/share-twitter.svg'
import { Icon } from '@/components/icon'

export function ShareLinks({ name, path }: { name: string; path: string }) {
  const url = new URL(path, window.location.origin).toString()
  const text = `${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <img src={shareLinkedin} alt="" width={15} height={15} />,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: <Icon name="message" />,
    },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <img src={shareTwitter} alt="" width={16} height={13} />,
    },
  ]

  return (
    <div className="flex items-center gap-2">
      <p className="text-body leading-4 font-bold whitespace-nowrap text-cream">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-2 text-cream">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={`Compartilhar por ${link.label}${link.href.startsWith('mailto:') ? '' : ' (abre em nova aba)'}`}
              className="grid size-6 place-items-center rounded-sm transition-opacity hover:opacity-80"
            >
              {link.icon}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
