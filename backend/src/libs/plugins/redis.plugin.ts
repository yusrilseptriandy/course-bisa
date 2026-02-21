import Elysia from "elysia";
import redis from "../redis";

export const redisPlugin = new Elysia({name: "redis"}).decorate("redis", redis)