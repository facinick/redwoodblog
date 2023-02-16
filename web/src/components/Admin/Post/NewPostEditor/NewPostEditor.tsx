import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@redwoodjs/web'
import { toast } from '@redwoodjs/web/toast'

import { TipTapEditor } from 'src/components/Editor/TipTapEditor'
import { isImageValid } from 'src/hooks/useImageValidator'
import { useNewPostStore } from 'src/store/zustand/newPostStore'
import { CreatePostMutation } from 'types/graphql'
import { navigate, routes } from '@redwoodjs/router'
import { wait } from 'src/utils/typescript'

const CREATE_POST_MUTATION = gql`
  mutation CreatePostMutation($input: CreatePostInput!) {
    createPost(input: $input) {
      id
    }
  }
`
export function NewPostEditor() {

  const { title, body, headerImageUrl, setTitle, setBody, setHeaderImageUrl, reset } = useNewPostStore()

  const [createPost, { loading }] = useMutation<CreatePostMutation>(CREATE_POST_MUTATION, {
    onCompleted: () => {
      toast.success('Post created')
      reset()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const editorRef = useRef(null)
  const initialBodyValue = useMemo(() => {
    return body
  }, [])

  const [_validatingHeaderImageUrl, setValidatingHeaderImageUrl] =
    useState<boolean>(false)

  const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    const title = event.target.value
    setTitle(title)
  }

  const onBodyChange = (newValue: string) => {
    setBody(newValue)
  }

  const onHeaderImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    const headerImageUrl = event.target.value
    setHeaderImageUrl(headerImageUrl)
  }

  const onSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    const _title = title.trim()
    const _body = body.trim()
    const _headerImageUrl = headerImageUrl.trim()

    if (_title === '') {
      toast.error(`Title cannot be empty`)
      return
    }

    if (_body === '') {
      toast.error(`Post content cannot be empty`)
      return
    }

    if (_headerImageUrl !== '') {
      await setValidatingHeaderImageUrl((_state) => true)
      const isValid = await isImageValid(headerImageUrl)
      if (!isValid) {
        toast.error(`Header image URL is not okay`)
        return
      }
      await setValidatingHeaderImageUrl((_state) => false)
    }

    const newPost = await createPost({
      variables: {
        input: {
          title: _title,
          body: _body,
          ...(_headerImageUrl && { headerImageUrl: _headerImageUrl })
        }
      },
    })

    reset()
    wait({seconds: 0.5})
    navigate(routes.postdetailed({ id: newPost.data.createPost.id}))
  }

  const onClearInputs = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    reset()
  }

  const disableInputs = loading || _validatingHeaderImageUrl

  return (
    <>
      <div className='flex flex-col gap-5 items-center w-[100%] sm:w-[80%]'>
        <div className="form-control w-full">
          <input disabled={disableInputs} required onChange={onTitleChange} value={title} type="text" placeholder="Title: Make every letter count" className="input input-bordered w-full" />
        </div>

        <div className="form-control w-full">
          <input disabled={disableInputs} onChange={onHeaderImageUrlChange} value={headerImageUrl} type="text" placeholder="Image url" className="input input-bordered w-full" />
        </div>

        <TipTapEditor
          onEditorChange={onBodyChange}
          disable={disableInputs}
          ref={editorRef}
          initialValue={initialBodyValue}
          value={body}
        />
        <div className='flex flex-row gap-5 ml-auto'>
          <button className="btn-secondary btn" disabled={disableInputs} onClick={onClearInputs}>
            clear
          </button>
          <button className="btn-primary btn" disabled={disableInputs} onClick={onSubmit}>
            {disableInputs ? "Submitting" : "Submit"}
          </button>
        </div>
      </div>
    </>
  )
}