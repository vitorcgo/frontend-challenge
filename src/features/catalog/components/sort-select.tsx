import { useId } from 'react'
import { NFT_SORTS, type NftSort } from '@/api/contracts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SORT_LABELS } from '../labels'

interface SortSelectProps {
  value: NftSort
  onChange: (sort: NftSort) => void
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  const labelId = useId()
  return (
    <div className="flex items-center gap-3">
      <span id={labelId} className="text-body whitespace-nowrap text-cream">
        Ordenar por:
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as NftSort)}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-auto gap-3 rounded-sm border-0 bg-transparent p-0 text-body text-cream shadow-none hover:text-accent-text"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end" className="border-line bg-surface-raised text-cream">
          {NFT_SORTS.map((sort) => (
            <SelectItem key={sort} value={sort} className="text-body focus:bg-surface-dark focus:text-accent-text">
              {SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
