import type {
  QueryResolvers,
  MutationResolvers,
  PostResolvers,
  QuerypostsArgs,
} from 'types/graphql'

import { db } from 'src/lib/db'
import { requireAuth, requirePostOwner } from 'src/lib/auth'

export function removeUndefinedKeys<T>(obj: T): T {
  // If obj is not an object or is null, return obj
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  // Recursively remove undefined keys from all properties of obj
  for (const key in obj) {
    const value = obj[key]
    if (typeof value === 'undefined') {
      delete obj[key]
    } else {
      obj[key] = removeUndefinedKeys(value)
    }
  }

  return obj
}

const nonNegative = (value: number): number => {
  if (value < 0) {
    return 0
  }
  return value
}

const OrderByVKey = ['createdat', 'activity', 'score']
const OrderByVOrder = ['asc', 'desc']

const parseQueryForPrisma = (
  query: QuerypostsArgs['query']
): Partial<Omit<QuerypostsArgs['query'], '__typename'>> => {
  let paginationQuery: Partial<
    Pick<QuerypostsArgs['query'], 'skip' | 'take' | 'cursor'>
  > = {
    skip: undefined,
    take: undefined,
    cursor: {
      id: undefined,
    },
  }

  if (query && !isNaN(query.skip) && !isNaN(query.take)) {
    paginationQuery.skip = query.skip
    paginationQuery.take = query.take + 1
    if (!isNaN(query.cursor?.id)) {
      paginationQuery.cursor.id = query.cursor.id
      console.log(`not deletig cursor`)
    } else {
      console.log(`deleting cursor`)
      delete paginationQuery['cursor']
    }
  } else {
    paginationQuery = {}
  }

  let filterByQuery: Partial<{
    where: {
      OR: {
        body: { contains: QuerypostsArgs['query']['filter'] }
        title: { contains: QuerypostsArgs['query']['filter'] }
      }
    }
  }> = {
    where: {
      OR: {
        body: {
          contains: undefined,
        },
        title: {
          contains: undefined,
        },
      },
    },
  }

  if (query && query.filter) {
    filterByQuery.where.OR.body.contains = query.filter
    filterByQuery.where.OR.title.contains = query.filter
  } else {
    filterByQuery = {}
  }

  let orderByByQuery: Partial<{
    orderBy:
      | Record<
          QuerypostsArgs['query']['orderBy']['key'],
          QuerypostsArgs['query']['orderBy']['order']
        >
      | [{ comments: { _count: string } }]
  }> = {
    orderBy: {
      createdAt: undefined,
    },
  }

  if (
    query &&
    query.orderBy &&
    query.orderBy.key &&
    query.orderBy.order &&
    OrderByVKey.includes(query.orderBy.key) &&
    OrderByVOrder.includes(query.orderBy.order)
  ) {
    if (query.orderBy.key === 'activity') {
      orderByByQuery.orderBy = [
        {
          comments: {
            _count: query.orderBy.order,
          },
        },
      ]
    } else {
      orderByByQuery.orderBy[query.orderBy.key] = query.orderBy.order
    }
  } else {
    orderByByQuery.orderBy['createdAt'] = 'desc'
  }

  // @ts-ignore
  return removeUndefinedKeys({
    ...paginationQuery,
    ...filterByQuery,
    ...orderByByQuery,
  })
}

const makeResponseForCats = () => {}

export const posts: QueryResolvers['posts'] = async ({
  query,
}: QuerypostsArgs) => {
  // const prismaQuery = parseQueryForPrisma(query)
  // parseQueryForPrisma(query)
  const prismaQuery = parseQueryForPrisma(query)

  console.log(`posts query:`)
  console.log(prismaQuery)

  // either <11 or 11, asked for 10 + 1
  // @ts-ignore
  const posts = await db.post.findMany({
    ...prismaQuery,
  })

  // wanted: 10, asked: 11, received < asked => end = true, don't pop
  // wanted: 10, asked: 11, received = asked => end = false, pop

  let wanted = undefined
  let asked = undefined
  let received = posts.length
  let end = undefined
  let count = undefined
  let lastRecord: (typeof posts)[0] | undefined = undefined

  // pagination was requested
  if (query && !isNaN(query.skip) && !isNaN(query.take)) {
    wanted = query.take
    asked = prismaQuery.take
    if (received < asked) {
      end = true
      count = nonNegative(received)
    }
    if (received >= asked) {
      end = false
      posts.pop()
      count = nonNegative(wanted)
    }
  }
  // pagination wasn't requested, we fetched all records
  else {
    count = nonNegative(received)
    end = true
  }

  console.log(`wanted: ${wanted}, asked: ${asked}, received: ${received}`)

  lastRecord = posts[posts.length - 1]

  const response = {
    posts,
    count,
    end,
    cursor: {
      id: lastRecord?.id,
    },
  }

  return response
}

export const post: QueryResolvers['post'] = async ({ id }) => {
  const post = await db.post.findUnique({
    where: { id },
  })
  return post
}

export const createPost: MutationResolvers['createPost'] = ({ input }) => {
  requireAuth()
  const authorId = context.currentUser.id
  return db.post.create({
    data: {
      authorId,
      ...input,
    },
  })
}

export const updatePost: MutationResolvers['updatePost'] = ({ id, input }) => {
  requirePostOwner({ id })
  return db.post.update({
    data: input,
    where: { id },
  })
}

export const deletePost: MutationResolvers['deletePost'] = ({ id }) => {
  requirePostOwner({ id })
  return db.post.delete({
    where: {
      id,
    },
    include: {
      author: true,
      votes: true,
    },
  })
}

export const Post: Partial<PostResolvers> = {
  author: (_obj, { root }) =>
    db.post.findUnique({ where: { id: root.id } }).author(),
  activity: async (_obj, { root }) =>
    db.comment.count({ where: { postId: root.id } }),
  comments: (_obj, { root }) => {
    return db.post.findUnique({ where: { id: root.id } }).comments()
  },
  votes: (_obj, { root }) =>
    db.post.findUnique({ where: { id: root.id } }).votes(),
}
