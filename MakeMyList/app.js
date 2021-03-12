const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const _ = require("lodash");

const PORT=process.env.PORT||5005
// Passport Requirements

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


// Passport setup

app.use(
  session({
    secret: "Its our makeMyList project",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());


//Mongoose connectivity

mongoose.connect("mongodb+srv://admin:admin123@cluster0.tnfsb.mongodb.net/projectDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true


});

// User Schema

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Item Schema

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your MakMyList!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<= Tick here to delete an item.",
});

const defaultItems = [item1, item2, item3];

// List Schema

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);



// GET Routs


app.get("/", (req, res) => {
  res.render("start");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/list",(req,res)=>{  
  if(req.isAuthenticated()){
    Item.find({}, function (err, foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully savevd default items to DB.");
          }
        });
        res.redirect("/list");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    });
      
  }else{
      res.render("login");
  }
});


app.get("/:customListName", function (req, res){

  const customListName = _.capitalize(req.params.customListName);

  if(req.isAuthenticated()){
    
    List.findOne({ name: customListName }, function (err, foundList) {
      if (!err) {
        if (!foundList) {
          //Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems,
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          //Show an existing list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      }
  });


  }else{
    res.render("login");
  }
})



// POST routs

app.post("/register", (req, res) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      function (error, user) {
        if (error) {
          console.log(error);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/list");
          });
        }
      }
    );
  });
  
  app.post("/login", (req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
  
    req.login(user, function (error) {
      if (error) {
        console.log(error);
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/list");
        });
      }
    });
  });

app.post("/list", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/list");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Deleted checked item.");
        res.redirect("/list");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});




app.listen(5005, function () {
  console.log(PORT,"Server Started on PORT 5005");
});
