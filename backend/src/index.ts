import "dotenv/config"
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { courseRoutes } from './routes/course';
import { errorHandler } from "./error/custome-error";
import { muxWebhookRoutes } from "./routes/mux-webhooks";
import { redisPlugin } from "./libs/plugins/redis.plugin";

const app = new Elysia()
            .use(cors())
            .use(redisPlugin)
            .use(errorHandler)
            app.use(muxWebhookRoutes)
            .listen(process.env.BACKEND_PORT || 4001)
            .use(courseRoutes)

console.log(
  ` Backend is running at ${app.server?.hostname}:${app.server?.port}`
)