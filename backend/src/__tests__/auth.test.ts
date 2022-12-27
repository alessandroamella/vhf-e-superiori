import supertest from "supertest";
import { createServer } from "../api/utils";

const app = createServer();

const agent = supertest.agent(app);

describe("auth", () => {
    describe("signup user", () => {
        describe("sends no params", () => {
            it("should return a 400", async () => {
                await agent.post("/auth/signup").expect(400);
            });
        });
        describe("sends empty object", () => {
            it("should return a 400", async () => {
                await agent.post("/auth/signup").send({}).expect(400);
            });
        });
        describe("sends no name", () => {
            it("should return a 400", async () => {
                await agent
                    .post("/auth/signup")
                    .send({
                        email: "alessandro.amella@live.it",
                        password: "cfAff@#$!f3",
                        callsign: "iu4qsG"
                    })
                    .expect(400);
            });
        });
        describe("sends weak password", () => {
            it("should return a 400", async () => {
                await agent
                    .post("/auth/signup")
                    .send({
                        email: "alessandro.amella@live.it",
                        password: "aaaaaaaaaaaaaa!!!",
                        callsign: "iu4qsG",
                        name: "Alexander Bitrey"
                    })
                    .expect(400);
            });
        });
        describe("sends everything ok", () => {
            it("should return a 400", async () => {
                await agent
                    .post("/auth/signup")
                    .send({
                        email: "    alessandro.amella@live.it  ",
                        password: "cfAff@#$!f3",
                        callsign: "    iU4qsG ",
                        name: "  Alexander Bitrey    "
                    })
                    .expect(200)
                    .expect(res => {
                        res.body.callsign = "IU4QSG";
                    });
            });
        });
    });
    // describe("get user", async () => {});
});
