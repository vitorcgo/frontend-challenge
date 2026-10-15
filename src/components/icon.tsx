import activity from '@/assets/icons/activity.svg'
import arrowDown2 from '@/assets/icons/arrow-down-2.svg'
import arrowLeft2 from '@/assets/icons/arrow-left-2.svg'
import arrowRight2 from '@/assets/icons/arrow-right-2.svg'
import arrowRight from '@/assets/icons/arrow-right.svg'
import cart from '@/assets/icons/cart.svg'
import chevronDown from '@/assets/icons/chevron-down.svg'
import close from '@/assets/icons/close.svg'
import dangerTriangle from '@/assets/icons/danger-triangle.svg'
import deleteIcon from '@/assets/icons/delete.svg'
import download from '@/assets/icons/download.svg'
import filter from '@/assets/icons/filter.svg'
import heartFilled from '@/assets/icons/heart-filled.svg'
import heartSm from '@/assets/icons/heart-sm.svg'
import heart from '@/assets/icons/heart.svg'
import hide from '@/assets/icons/hide.svg'
import home from '@/assets/icons/home.svg'
import image from '@/assets/icons/image.svg'
import location from '@/assets/icons/location.svg'
import logout from '@/assets/icons/logout.svg'
import message from '@/assets/icons/message.svg'
import minusButton from '@/assets/icons/minus-button.svg'
import moreVertical from '@/assets/icons/more-vertical.svg'
import plusButton from '@/assets/icons/plus-button.svg'
import scan from '@/assets/icons/scan.svg'
import searchMobile from '@/assets/icons/search-mobile.svg'
import search from '@/assets/icons/search.svg'
import shop from '@/assets/icons/shop.svg'
import shopping from '@/assets/icons/shopping.svg'
import star from '@/assets/icons/star.svg'
import userNav from '@/assets/icons/user-nav.svg'
import user from '@/assets/icons/user.svg'
import wallet from '@/assets/icons/wallet.svg'
import zoom from '@/assets/icons/zoom.svg'
import { cn } from '@/lib/utils'

const ICONS = {
  activity: [activity, 18, 18],
  'arrow-down-2': [arrowDown2, 16, 16],
  'arrow-left-2': [arrowLeft2, 20, 20],
  'arrow-right-2': [arrowRight2, 18, 18],
  'arrow-right': [arrowRight, 18, 18],
  cart: [cart, 24, 24],
  'chevron-down': [chevronDown, 20, 20],
  close: [close, 18, 18],
  'danger-triangle': [dangerTriangle, 18, 18],
  delete: [deleteIcon, 24, 24],
  download: [download, 18, 18],
  filter: [filter, 22, 22],
  'heart-filled': [heartFilled, 20, 17.79],
  'heart-sm': [heartSm, 16, 15],
  heart: [heart, 20, 20],
  hide: [hide, 23, 20],
  home: [home, 20, 20],
  image: [image, 24, 24],
  location: [location, 20, 20],
  logout: [logout, 20, 20],
  message: [message, 18, 18],
  minus: [minusButton, 16, 16],
  'more-vertical': [moreVertical, 3, 15],
  plus: [plusButton, 16, 16],
  scan: [scan, 27, 24],
  'search-mobile': [searchMobile, 22, 22],
  search: [search, 20, 20],
  shop: [shop, 20, 20],
  shopping: [shopping, 18, 18],
  star: [star, 15, 15],
  'user-nav': [userNav, 20, 20],
  user: [user, 18, 18],
  wallet: [wallet, 24, 24],
  zoom: [zoom, 20, 20],
} as const satisfies Record<string, readonly [string, number, number]>

export type IconName = keyof typeof ICONS

interface IconProps {
  name: IconName
  label?: string
  className?: string
}

export function Icon({ name, label, className }: IconProps) {
  const [src, width, height] = ICONS[name]
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        width,
        height,
        maskImage: `url("${src}")`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  )
}
