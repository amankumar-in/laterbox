import { XStack, Button, ScrollView } from 'tamagui'

interface FilterOption {
  key: string
  label: string
}

interface FilterChipsProps {
  options: FilterOption[]
  selected: string
  onSelect: (key: string) => void
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} flexGrow={0} flexShrink={0}>
      <XStack paddingHorizontal="$4" paddingTop="$1" paddingBottom="$3" gap="$2">
        {options.map((option) => {
          const isSelected = option.key === selected
          return (
            <Button
              key={option.key}
              size="$3"
              borderRadius="$10"
              backgroundColor={isSelected ? '$backgroundTinted' : 'transparent'}
              borderWidth={1}
              borderColor={isSelected ? '$borderColorTinted' : '$borderColor'}
              color={isSelected ? '$accentColor' : '$colorSubtle'}
              pressStyle={{
                backgroundColor: '$backgroundHover',
              }}
              onPress={() => onSelect(option.key)}
            >
              {option.label}
            </Button>
          )
        })}
      </XStack>
    </ScrollView>
  )
}
