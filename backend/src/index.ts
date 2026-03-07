import "dotenv/config"
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { courseRoutes } from './routes/course';
import { errorHandler } from "./error/custome-error";
import { redisPlugin } from "./libs/plugins/redis.plugin";
import { transactionRoutes } from "./routes/transaction";

const app = new Elysia()
            .use(cors())
            .use(redisPlugin)
            .use(errorHandler)
            .listen(process.env.BACKEND_PORT || 4001)
            .use(courseRoutes)
            .use(transactionRoutes);

console.log(
  ` Backend is running at ${app.server?.hostname}:${app.server?.port}`
)