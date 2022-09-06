import * as trpc from '@trpc/server';
import {string, z} from 'zod';
import { PrismaClient } from '@prisma/client'
import express from 'express'
import * as trpcExpress from '@trpc/server/adapters/express';
const app = express();
const prisma = new PrismaClient()

type Context = trpc.inferAsyncReturnType<typeof createContext>;
const createContext = ({req, res,}: trpcExpress.CreateExpressContextOptions) => ({})

const appRouter = trpc.router<Context>().query('getUser', {
        input: (val: unknown) => {
            if (typeof val === "string")
                return val;
        },
        async resolve(req) {
            // деструктуризация
            let foundUser = prisma.userModel.findMany({
                where: {
                    name: req.input
                }
            });
            if(!foundUser){
                throw new trpc.TRPCError({
                    code: 'BAD_REQUEST',
                    message: `could not find cat with id ${req.input}`
                })
            }
            return foundUser
        },
    })
    .mutation('createUser', {
        // validate input with Zod
        input: z.object({ name: z.string().min(5) }),
        async resolve(req) {
            // use your ORM of choice
            return await prisma.userModel.create({
                data: req.input,
            });
        },
    });


// created for each request
 // no context

app.use('/trpc', trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    })
);


const start = async () => {
    try {
        app.listen(2000, () => console.log(`Server started on port 2000`) )
    }
    catch (e) {
        console.log(e)
    }
}
start()


export type AppRouter = typeof appRouter;