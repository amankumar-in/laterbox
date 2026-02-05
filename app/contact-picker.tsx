import { useCallback, useEffect, useState } from 'react'
import { FlatList, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Contacts from 'expo-contacts'
import { XStack, YStack, Text, Button } from 'tamagui'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getContactPickerCallback, clearContactPickerCallback } from '@/services/contactPickerStore'
import type { AttachmentResult } from '@/hooks/useAttachmentHandler'

interface ContactItem {
  id: string
  name: string
  phones: string[]
  emails: string[]
}

export default function ContactPickerScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { iconColor, color, placeholderColor, background, borderColor } = useThemeColor()
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [filteredContacts, setFilteredContacts] = useState<ContactItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  useEffect(() => {
    if (!search.trim()) {
      setFilteredContacts(contacts)
    } else {
      const q = search.toLowerCase()
      setFilteredContacts(
        contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phones.some((p) => p.includes(q)) ||
            c.emails.some((e) => e.toLowerCase().includes(q))
        )
      )
    }
  }, [search, contacts])

  async function loadContacts() {
    const { status } = await Contacts.requestPermissionsAsync()
    if (status !== 'granted') {
      setPermissionDenied(true)
      setLoading(false)
      return
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      sort: Contacts.SortTypes.FirstName,
    })

    const mapped: ContactItem[] = data
      .filter((c) => c.name)
      .map((c) => ({
        id: c.id!,
        name: c.name!,
        phones: (c.phoneNumbers || []).map((p) => p.number!).filter(Boolean),
        emails: (c.emails || []).map((e) => e.email!).filter(Boolean),
      }))

    setContacts(mapped)
    setLoading(false)
  }

  const handleSelect = useCallback(
    (contact: ContactItem) => {
      const lines: string[] = []
      contact.phones.forEach((p) => lines.push(`Phone: ${p}`))
      contact.emails.forEach((e) => lines.push(`Email: ${e}`))

      const result: AttachmentResult = {
        type: 'contact',
        contactName: contact.name,
        content: `${contact.name}\n${lines.join('\n')}`,
      }

      const cb = getContactPickerCallback()
      if (cb) {
        cb(result)
        clearContactPickerCallback()
      }

      router.back()
    },
    [router]
  )

  const renderItem = useCallback(
    ({ item }: { item: ContactItem }) => (
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        gap="$3"
        alignItems="center"
        pressStyle={{ backgroundColor: '$backgroundHover' }}
        onPress={() => handleSelect(item)}
      >
        <XStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor="$orange5"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$4" fontWeight="600" color="$color">
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </XStack>
        <YStack flex={1}>
          <Text fontSize="$4" fontWeight="500" color="$color" numberOfLines={1}>
            {item.name}
          </Text>
          {item.phones[0] && (
            <Text fontSize="$2" color="$colorSubtle" numberOfLines={1}>
              {item.phones[0]}
            </Text>
          )}
        </YStack>
      </XStack>
    ),
    [handleSelect]
  )

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack
        paddingHorizontal="$3"
        paddingVertical="$2"
        alignItems="center"
        gap="$2"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Button size="$3" circular chromeless onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </Button>
        <Text fontSize="$5" fontWeight="600" color="$color" flex={1}>
          Select Contact
        </Text>
      </XStack>

      <XStack
        paddingHorizontal="$4"
        paddingVertical="$2"
      >
        <XStack
          flex={1}
          backgroundColor="$backgroundStrong"
          borderRadius="$4"
          height={40}
          alignItems="center"
          paddingHorizontal="$3"
          gap="$2"
        >
          <Ionicons name="search" size={18} color={iconColor} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color }}
            placeholder="Search contacts..."
            placeholderTextColor={placeholderColor}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </XStack>
      </XStack>

      {loading ? (
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$colorSubtle">Loading contacts...</Text>
        </YStack>
      ) : permissionDenied ? (
        <YStack flex={1} justifyContent="center" alignItems="center" paddingHorizontal="$6">
          <Ionicons name="lock-closed" size={48} color={iconColor} />
          <Text color="$colorSubtle" textAlign="center" marginTop="$3">
            Contacts permission is required to share contacts. Please enable it in Settings.
          </Text>
        </YStack>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <YStack paddingVertical="$6" alignItems="center">
              <Text color="$colorSubtle">
                {search ? 'No contacts found' : 'No contacts'}
              </Text>
            </YStack>
          }
        />
      )}
    </YStack>
  )
}
