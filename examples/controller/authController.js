const loginHandler = (req, res) => {
  const { email, password } = req.body;
  res.json({ token: 'jwt-token-here', user: { email } });
}

const registerHandler = (req, res) => {
  const { name, email, password } = req.body;
  res.status(201).json({ user: { name, email } });
}

const logoutHandler = (req, res) => {
  res.json({ success: true });
}

const passwordResetHandler = (req, res) => {
  const { email } = req.body;
  res.json({ message: 'Reset email sent' });
}

module.exports = {
  loginHandler,
  registerHandler,
  logoutHandler,
  passwordResetHandler
};
