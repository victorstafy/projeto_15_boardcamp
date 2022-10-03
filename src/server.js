import dotenv from "dotenv";
import express from "express";

import cors from "cors";
import connection from "./database/database.js";
import dayjs from "dayjs";
import joi from "joi";

dotenv.config();

const server = express();

// express 
server.use(express.json());
server.use(cors());

server.get('/status', (req,res)=>{
    try{
        res.send('ok')
    }
    catch(error){
        console.log(error)
    }
})

const categorieSchema = joi
.object({
    name: joi.string().empty("").required(),
});

const gameSchema = joi
.object({
    name: joi.string().empty("").required(),
    image: joi.string().empty("").required(),
    stockTotal: joi.number().positive().greater(0).required(),
    categoryId: joi.string().empty("").required(),
    pricePerDay: joi.number().positive().greater(0).required(),
});

const customerPostSchema = joi
.object({
    name: joi.string().empty("").required(),
    phone: joi.string().max(11).min(10).pattern(/^[0-9]+$/).required(),
    cpf: joi.string().length(11).pattern(/^[0-9]+$/).required(),
    birthday: joi.date().required(),
});

//routes-
server.post('/categories', async (req, res) => {
    const name = req.body;
    
    const validation = categorieSchema.validate(req.body, {
        abortEarly: false,
    });

    try {
        if (validation.error) {
            return res.status(400).send(validation.error.details);
        }
        const previos_name=await connection.query("SELECT * FROM categories WHERE name=$1",[name]);

        if (previos_name) {
            return res.sendStatus(409);
        }

        const InsertName=await connection.query("INSERT INTO categories (name) VALUES ($1)",[name]);

        res.sendStatus(201);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

server.get('/categories', async (req, res) => {
    try {
        const categories_list = await connection.query('SELECT * FROM categories;');

        res.status(200).send(categories_list);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});



server.post('/games', async (req, res) => {
    const game_obj = req.body;
    
    const validation = gameSchema.validate(req.body, {
        abortEarly: false,
    });

    try {
        if (validation.error) {
            return res.status(400).send(validation.error.details);
        }
        const previos_category=await connection.query("SELECT * FROM categories WHERE id=$1",[game_obj.categoryId]);
        const previos_name=await connection.query("SELECT * FROM games WHERE id=$1",[game_obj.name]);

        if (!previos_category) {
            return res.sendStatus(400);
        }
        if (previos_name) {
            return res.sendStatus(409);
        }

        const InsertGame=await connection.query("INSERT INTO games (name,image,stockTotal,categoryId,pricePerDay) VALUES ($1)",
        [game_obj.name,game_obj.image,game_obj.stockTotal,game_obj.categoryId,game_obj.pricePerDay]);

        res.sendStatus(201);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

server.get('/games', async (req, res) => {
	const name = req.query.name;

    try {
        if (name){
            const game_list = await connection.query('SELECT * FROM games WHERE name=$1;',[name]);
        }
        else{
            const game_list = await connection.query('SELECT * FROM games;');
        }
        
        res.status(200).send(game_list);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});



server.post('/customers', async (req, res) => {
    const customer_obj = req.body;
    
    const validation = customerPostSchema.validate(req.body, {
        abortEarly: false,
    });

    try {
        if (validation.error) {
            return res.status(400).send(validation.error.details);
        }

        const previos_cpf=await connection.query("SELECT * FROM customers WHERE cpf=$1",[customer_obj.cpf]);
        if (previos_cpf) {
            return res.sendStatus(409);
        }

        const InsertCustomer=await connection.query("INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1)",
        [customer_obj.name,customer_obj.phone,customer_obj.cpf,customer_obj.birthday]);

        res.sendStatus(201);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

server.put('/customers/:id', async (req, res) => {
    const customer_obj = req.body;
    const id= req.params;
    
    const validation = customerPostSchema.validate(req.body, {
        abortEarly: false,
    });

    try {
        if (validation.error) {
            return res.status(400).send(validation.error.details);
        }

        const previos_cpf=await query(`UPDATE customers 
        SET name = $1, phone = $2, cpf = $3, birthday = $4
        WHERE id = $5`,
        [customer_obj.name, customer_obj.phone, customer_obj.cpf, customer_obj.birthday, id]);

        if (previos_cpf) {
            return res.sendStatus(409);
        }

        const InsertCustomer=await connection.query("INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1)",
        [customer_obj.name,customer_obj.phone,customer_obj.cpf,customer_obj.birthday]);

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

server.get('/customers', async (req, res) => {
	const cpf_init = req.query.cpf;

    try {
        if (cpf){
            const customer_list = await connection.query('SELECT * FROM customers WHERE cpf LIKE $1;',[cpf_init]);
        }
        else{
            const customer_list = await connection.query('SELECT * FROM customers;');
        }
        
        res.status(200).send(customer_list)
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

server.get('/customers/:id', async (req, res) => {
	const id= req.params;
    
    try {
        const customer = await connection.query('SELECT * FROM customers WHERE id =$1;',[id]);
        if (customer){
            res.status(200).send(customer);
            return;
        }
        else{
            res.status(404);
            return;
        } 
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});




server.post('/rentals', async (req, res) => {
    const rent_obj = req.body;

    try {

        const previos_customer=await connection.query("SELECT * FROM customers WHERE id=$1",[customer_obj.customerId]);
        const previos_game=await connection.query("SELECT * FROM game WHERE id=$1",[customer_obj.gameId]);

        if (!previos_customer || !previos_game || rent_obj.daysRented<0) {
            return res.sendStatus(404);
        }

        connection.query(`INSERT INTO rentals(
            "customerId", "gameId", "rentDate", "daysRented", 
            "returnDate", "originalPrice", "delayFee") 
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [rent_obj.customerId,rent_obj.gameId, dayjs().format('YYYY-MM-DD'),rent_obj.daysRented,null,(previous_game.pricePerDay * rent_obj.daysRented),null]);
        connection
        .query(`UPDATE games SET "stockTotal" = $1 WHERE id = $2`,
        [previos_game.stockTotal - 1, previos_game.id])

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

server.post('/rentals:id/return', async (req, res) => {
	const id = req.params;

    try {
        const rental = await connection.query('SELECT * FROM rentals WHERE id $1;',[id]);

        if (!rental){
            res.sendStatus(404);
            return;
        }
        if(rental.returnData){
            res.sendStatus(400);
            return;
        }
        
        const delay=dayjs().diff(dayjs(rental.rentDate).add(rental.daysRented),'days');
        
        if (delay>0){
            const delayFee=Math.trunc((rental.originalPrice / rental.daysRented))*Math.floor(delay);
        }
        else{
            const delayFee=null;
        }

        connection.query(`UPDATE rentals SET "returnDate"= $1,"delayFee"= $2 WHERE id = $3`,
            [rental.returnDate,
            rental.delayFee,
            rental.id])

        res.status(200)
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

server.get('/rentals', async (req, res) => {
    const {customerId} = req.query.customerId;
    const {gameId} = req.query.gameId;
    
    try {
        if (customerId || gameId){
            if (customerId){
                const rent_list = (await connection.query(`'SELECT * FROM rentals WHERE customerId=$1;' 
                                `, [customerId]))
                    .rows.map((rent) => ({
                        id: rent.id,
                        customerId: rent.customerId,
                        gameId: rent.gameId,
                        rentDate: dayjs(rent.rentDate).format('YYYY-MM-DD'),
                        daysRented: rent.daysRented,
                        returnDate: rent.returnDate,
                        originalPrice: rent.originalPrice,
                        delayFee: rent.delayFee,
                        customer: {
                            id: rent.customerId,
                            name: rent.customerName
                        },
                        game: {
                            id: rent.gameId,
                            name: rent.gameName,
                            categoryId: rent.categoryId,
                            categoryName: rent.categoryName,
                        },
                    }));
                    return res.status(200).send(rent_list)
            }
            else if (gameId){
                const rent_list = (await connection.query(`'SELECT * FROM rentals WHERE gameId=$1;' 
                                `, [gameId]))
                .rows.map((rent) => ({
                    id: rent.id,
                    customerId: rent.customerId,
                    gameId: rent.gameId,
                    rentDate: dayjs(rent.rentDate).format('YYYY-MM-DD'),
                    daysRented: rent.daysRented,
                    returnDate: rent.returnDate,
                    originalPrice: rent.originalPrice,
                    delayFee: rent.delayFee,
                    customer: {
                        id: rent.customerId,
                        name: rent.customerName
                    },
                    game: {
                        id: rent.gameId,
                        name: rent.gameName,
                        categoryId: rent.categoryId,
                        categoryName: rent.categoryName,
                    },
                }));
                return res.status(200).send(rent_list)
            }
        }
        else {
            const rent_list = (await connection.query(`'SELECT * FROM rentals'`))
                .rows.map((rent) => ({
                    id: rent.id,
                    customerId: rent.customerId,
                    gameId: rent.gameId,
                    rentDate: dayjs(rent.rentDate).format('YYYY-MM-DD'),
                    daysRented: rent.daysRented,
                    returnDate: rent.returnDate,
                    originalPrice: rent.originalPrice,
                    delayFee: rent.delayFee,
                    customer: {
                        id: rent.customerId,
                        name: rent.customerName
                    },
                    game: {
                        id: rent.gameId,
                        name: rent.gameName,
                        categoryId: rent.categoryId,
                        categoryName: rent.categoryName,
                    },
                }));
                return res.status(200).send(rent_list)
        }   } 
    catch(err){
        console.error(err);
        res.sendStatus(500);
    }
})

server.delete('/rentals/:id', async (req, res)=>{
    const id = req.params;

    try{
        const rental = await connection.query('SELECT * FROM rentals WHERE id $1;',[id]);

        if (!rental){
            res.sendStatus(404);
            return;
        }
        if(rental.returnData){
            res.sendStatus(400);
            return;
        }

        connection.query(`DELETE FROM rentals WHERE id = $1`, [id]);
    }
    catch(err){
        console.error(err);
        res.sendStatus(500);
    }
})


server.listen(process.env.PORT, () => {
    console.log('Server running on port ' + process.env.PORT);
})
