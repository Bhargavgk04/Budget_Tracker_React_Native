const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Friendship = require("../models/Friendship");
const Transaction = require("../models/Transaction");
const Settlement = require("../models/Settlement");
const Group = require("../models/Group");

jest.setTimeout(30000);

describe("Friend & Expense Splitting API Tests", () => {
  let authToken1, authToken2, user1Id, user2Id;

  beforeAll(async () => {
    // Register test users via API to ensure password is hashed
    const register1 = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User 1",
        email: "test1@example.com",
        password: "Password@1234",
        uid: "testuser1"
      });
    user1Id = register1.body.data.user._id || register1.body.data.user.id;

    const register2 = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User 2",
        email: "test2@example.com",
        password: "Password@1234",
        uid: "testuser2"
      });
    user2Id = register2.body.data.user._id || register2.body.data.user.id;

    // Get auth tokens
    const login1 = await request(app)
      .post("/api/auth/login")
      .send({ email: "test1@example.com", password: "Password@1234" });
    authToken1 = login1.body.data.token;

    const login2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "test2@example.com", password: "Password@1234" });
    authToken2 = login2.body.data.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Friendship.deleteMany({});
    await Transaction.deleteMany({});
    await Settlement.deleteMany({});
    await Group.deleteMany({});
    await mongoose.connection.close();
  });

  describe("Friend Management", () => {
    test("Should search for users", async () => {
      const res = await request(app)
        .post("/api/friends/search")
        .set("Authorization", `Bearer ${authToken1}`)
        .send({ query: "testuser2" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    test("Should send friend request", async () => {
      const res = await request(app)
        .post("/api/friends/request")
        .set("Authorization", `Bearer ${authToken1}`)
        .send({ recipientId: user2Id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("Should accept friend request", async () => {
      const friendship = await Friendship.findOne({
        requester: user1Id,
        recipient: user2Id,
      });

      const res = await request(app)
        .post(`/api/friends/${friendship._id}/accept`)
        .set("Authorization", `Bearer ${authToken2}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("Should get friend list", async () => {
      const res = await request(app)
        .get("/api/friends")
        .set("Authorization", `Bearer ${authToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe("Expense Splitting", () => {
    let transactionId;

    test("Should create shared transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken1}`)
        .send({
          amount: 1000,
          category: "Food",
          type: "expense",
          friendUid: "testuser2",
          friendId: user2Id,
          splitInfo: {
            isShared: true,
            paidBy: user1Id,
            splitType: "equal",
            participants: [
              { user: user1Id, share: 500 },
              { user: user2Id, share: 500 },
            ],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      transactionId = res.body.data._id;
    });

    test("Should get shared transactions", async () => {
      const res = await request(app)
        .get("/api/transactions/shared")
        .set("Authorization", `Bearer ${authToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe("Settlement Management", () => {
    let settlementId;

    test("Should create settlement", async () => {
      const res = await request(app)
        .post("/api/settlements")
        .set("Authorization", `Bearer ${authToken2}`)
        .send({
          recipientId: user1Id,
          amount: 500,
          paymentMethod: "upi",
          notes: "Test settlement",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      settlementId = res.body.data._id;
    });

    test("Should confirm settlement", async () => {
      const res = await request(app)
        .post(`/api/settlements/${settlementId}/confirm`)
        .set("Authorization", `Bearer ${authToken1}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("Should get settlements", async () => {
      const res = await request(app)
        .get("/api/settlements")
        .set("Authorization", `Bearer ${authToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe("Group Management", () => {
    let groupId;

    test("Should create group", async () => {
      const res = await request(app)
        .post("/api/groups")
        .set("Authorization", `Bearer ${authToken1}`)
        .send({
          name: "Test Group",
          type: "trip",
          memberIds: [user2Id],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      groupId = res.body.data._id;
    });

    test("Should get user groups", async () => {
      const res = await request(app)
        .get("/api/groups")
        .set("Authorization", `Bearer ${authToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    test("Should get group details", async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}`)
        .set("Authorization", `Bearer ${authToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("Debt Simplification", () => {
    test("Should get simplified settlements for friend", async () => {
      const res = await request(app)
        .get(`/api/friends/${user2Id}/simplify`)
        .set("Authorization", `Bearer ${authToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
