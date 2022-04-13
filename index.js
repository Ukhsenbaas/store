import crypto from 'crypto'
import express from 'express';
import { db } from './firebase.js'

import { collection, getDocs, addDoc, getDoc, doc, setDoc, deleteDoc } from "firebase/firestore";

const app = express();
const port = 8080

app.use(express.json())

// const isAuthenticated = async (req, res, next) => {
//     if (!req.headers.authorization) {
//         return res.status(402).send([]);
//     }

//     const sessionDoc = await getDoc(doc(db, 'sessions', req.headers.authorization))
//     if (!sessionDoc.exists()) {
//         return res.status(403).send([]);
//     }

//     if (sessionDoc.data().expireDate.seconds <= new Date().getTime() / 1000) {
//         return res.status(403).send([]);
//     }

//     const userDoc = await getDoc(doc(db, 'users', sessionDoc.data().user));
//     req.user = userDoc;

//     next();
// }

// const isAdmin = (req, res, next) => {
//     if (!req.user.data().isAdmin) {
//         return res.status(403).send({});
//     }

//     next();
// }

// Authentication & Authorization
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await getDoc(doc(db, "users", username))
    if (!user.exists()) { // User with this username does not exist.
        return res.status(400).send({
            'message': "This username does not exist.",
        });
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.data().password !== hash) {
        return res.status(400).send({
            'message': "Wrong password!",
        });
    }

    const token = crypto.randomUUID();
    await setDoc(doc(db, 'sessions', token), {
        user: user.id,
        expireDate: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.send({ token });
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const user = await getDoc(doc(db, "users", username))
    if (user.exists()) { // User with this username does already exist.
        return res.status(400).send({
            'message': "This username already exists.",
        });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    await setDoc(doc(db, 'users', username), {
        password: hashedPassword,
    });

    res.send({ success: true });
})


app.post('/logout', (req, res) => {
    res.send('OK');
})

// List products
// Can be filtered by categoryId, userId
app.get('/products',  async (req, res) => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const products = []
    for (const doc of querySnapshot.docs) {
        products.push({
            id: doc.id,
            ...doc.data(),
        })
    }

    res.send(products);
})

// Create product
app.post('/products', async (req, res) => {
    const data = req.body;
    const docRef = await addDoc(collection(db, "products"), data);

    res.status(201).send({
        id: docRef.id,
        ...data,
    })
})

const errorHandlerWrapper = (fn) => {
    return async (req, res, next) => {
        try {
            return await fn(req, res, next);
        } catch (e) {
            next(e);
        }
    };
}

// Product detail
app.get('/products/:id', errorHandlerWrapper(async (req, res) => {
    const docSnapshot = await getDoc(doc(db, "products", req.params.id));
    if (!docSnapshot.exists()) {
        throw new Error(`Document with id: ${ req.params.id } not exist`)
    }

    res.status(200).send({
        id: docSnapshot.id,
        ...docSnapshot.data(),
    });
}));

// Edit product
app.patch('/products/:id', async (req, res) => {
    const editableFields = ['name', 'description', 'price'];
    for (const key of Object.keys(req.body)) {
        if (!editableFields.includes(key)) {
            res.status(400).send({
                message: `"${key}" field is not editable!`,
            });
            return;
        }
    }

    const docRef = doc(db, "products", req.params.id);
    await setDoc(docRef, req.body, { merge: true });
    const docSnapshot = await getDoc(docRef);

    res.send({
        id: docSnapshot.id,
        ...docSnapshot.data(),
    })
})

app.put('/products/:id', errorHandlerWrapper(async (req, res) => {
    const allFields = ['name', 'description', 'price'];
    for (const field of allFields) {
        if (!Object.keys(req.body).includes(field)) {
            throw new Error(`"${field}" field is required!`);
        }
    }

    const docRef = doc(db, "products", req.params.id);
    await setDoc(docRef, req.body);
    const docSnapshot = await getDoc(docRef);

    res.send({
        id: docSnapshot.id,
        ...docSnapshot.data(),
    })
}))

// Delete product
app.delete('/products/:id', async (req, res) => {
    const docRef = doc(db, "products", req.params.id);
    await deleteDoc(docRef);
    res.status(204).send({})
})

// Get current user details
app.get('/me', (req, res) => {
    // document.get
    res.send('me')
})

app.use('*', (req, res) => {
    res.status(404).send('This page is not found');
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})