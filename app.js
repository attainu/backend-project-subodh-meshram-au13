const express = require ("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date =require(__dirname +"/date.js");
const app = express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true,useUnifiedTopology: true});


const itemsSchema ={
    name: String

};


const Item =mongoose.model("Item", itemsSchema);

const item1 =new Item({

    name:"welcome to do list !" 
});

const item2 =new Item({

    name:"hti the button!" 
});

const item3 =new Item({

    name:"hit the delet item!" 
});
 
const defaultItems = [item1,item2,item3]
Item.insertMany(defaultItems,function(err){
    if(err){
        console.log(err);
    }else{
        console.log("success")
    }
})




//const items = ["buy food","cook food","eat food"]
const workitems = [];

app.get("/", function(req, res){
    const day =date.getDate();

    res.render("List ",{listTittle:"Today",newListItems:items});

});

app.post("/",function(req,res){  


    const item =req.body.newItems;
    if (req.body.list ==="Work"){
        workitems.push(item);
        res.redirect("work");
    }else{
        res.redirect("/");
    }

});

