import supertest from "supertest";
import { createServer } from "../api/utils";

const app = createServer();

describe("auth", () => {
    describe("signup user", () => {
        describe("sends no params", () => {
            it("should return a 400", async () => {
                await supertest(app).post("/auth/signup").expect(400);
            });
        });
    });
    // describe("get user", async () => {});
});
