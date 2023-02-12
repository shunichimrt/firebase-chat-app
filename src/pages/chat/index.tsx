import {
  Avatar,
  Box,
  Button,
  chakra,
  Container,
  Flex,
  Heading,
  Input,
  Spacer,
  Text,
} from '@chakra-ui/react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { getDatabase, onChildAdded, push, ref } from '@firebase/database'
import { FirebaseError } from '@firebase/util'
import { AuthGuard } from '@src/feature/auth/component/AuthGuard/AuthGuard'
import { useAuthContext } from '@src/feature/auth/provider/AuthProvider'

type MessageProps = {
  bg: string
  message: string
}

const Message = ({ bg, message }: MessageProps) => {
  return (
    <Flex alignItems={bg}>
      <Avatar bg={bg} />
      <Box ml={2}>
        <Text bgColor={'gray.200'} rounded={'md'} px={2} py={1}>
          {message}
        </Text>
      </Box>
    </Flex>
  )
}

export const Page = () => {
  const messagesElementRef = useRef<HTMLDivElement | null>(null)
  const [message, setMessage] = useState<string>('')
  const { user } = useAuthContext()
  const id = user?.uid
  console.log(user)

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const db = getDatabase()
      const dbRef = ref(db, 'chat-test')
      await push(dbRef, {
        id,
        message,
      })
      setMessage('')
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
  }

  const [chats, setChats] = useState<{ sendId: string; message: string }[]>([])

  useEffect(() => {
    try {
      const db = getDatabase()
      const dbRef = ref(db, 'chat-test')
      return onChildAdded(dbRef, (snapshot) => {
        const sendId = String(snapshot.val()['id'] ?? '')
        const message = String(snapshot.val()['message'] ?? '')
        setChats((prev) => [...prev, { sendId, message }])
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [])

  useEffect(() => {
    messagesElementRef.current?.scrollTo({
      top: messagesElementRef.current.scrollHeight,
    })
  }, [chats])

  return (
    <AuthGuard>
      <Container
        py={14}
        flex={1}
        display={'flex'}
        flexDirection={'column'}
        minHeight={0}
      >
        <Heading>チャット</Heading>
        <Spacer flex={'none'} height={4} aria-hidden />
        <Flex
          flexDirection={'column'}
          overflowY={'auto'}
          gap={2}
          ref={messagesElementRef}
        >
          {chats.map((chat, index) =>
            chat.sendId == id ? (
              <Message
                bg="teal.500"
                message={chat.message}
                key={`ChatMessage_${index}`}
              />
            ) : (
              <Message
                bg="red.500"
                message={chat.message}
                key={`ChatMessage_${index}`}
              />
            )
          )}
        </Flex>
        <Spacer aria-hidden />
        <Spacer height={2} aria-hidden flex={'none'} />
        <chakra.form display={'flex'} gap={2} onSubmit={handleSendMessage}>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button type={'submit'}>送信</Button>
        </chakra.form>
      </Container>
    </AuthGuard>
  )
}

export default Page
