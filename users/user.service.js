const config = require("config.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("_helpers/db");
const User = db.User;

module.exports = {
  authenticate,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
  logout,
};

async function authenticate({ username, password, role, ip }) {
  const user = await User.findOne({ username, role });
  if (user && bcrypt.compareSync(password, user.hash)) {
    const updatedUser = {
      ...user,
      loginTime: Date.now(),
      logoutTime: Date.now(),
      ip,
    };
    Object.assign(user, updatedUser);
    await user.save();
    const { hash, ...userWithoutHash } = user.toObject();
    const token = jwt.sign({ sub: user.id, role: user.role }, config.secret);
    return {
      ...userWithoutHash,
      token,
    };
  }
}

async function getAll(page, limit) {
  let records;
  if (page === -1) {
    records = await User.find().select("-hash");
  } else {
    const start = page != 1 ? limit * (page - 1) : 1;
    records = await User.find().select("-hash").limit(10).skip(start);
  }
  const totalRecords = await User.count();
  return { records, totalRecords };
}

async function getById(id) {
  return await User.findById(id).select("-hash");
}

async function create(userParam) {
  // validate
  if (await User.findOne({ username: userParam.username })) {
    throw 'Username "' + userParam.username + '" is already taken';
  }

  const user = new User(userParam);

  // hash password
  if (userParam.password) {
    user.hash = bcrypt.hashSync(userParam.password, 10);
  }

  // save user
  await user.save();
}

async function update(id, userParam) {
  const user = await User.findById(id);

  // validate
  if (!user) throw "User not found";
  if (
    user.username !== userParam.username &&
    (await User.findOne({ username: userParam.username }))
  ) {
    throw 'Username "' + userParam.username + '" is already taken';
  }

  // hash password if it was entered
  if (userParam.password) {
    userParam.hash = bcrypt.hashSync(userParam.password, 10);
  }

  // copy userParam properties to user
  Object.assign(user, userParam);

  await user.save();
}

async function _delete(id) {
  await User.findByIdAndRemove(id);
}

async function logout({ logout:_id }) {
  await User.findByIdAndUpdate(_id, { logoutTime: Date.now() }, (err) => {
    if (err) {
      throw "Logout Failed";
    }
  });
}
