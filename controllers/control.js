async function handleHomePage(req, res, next) {
  try {
    res.render("home");
  } catch (err) {
    console.log(err);
  }
}
export { handleHomePage };
