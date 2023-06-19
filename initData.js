import axios from 'axios';
import fs from 'fs';
import 'dotenv/config';

const { entities, relationshipsGroups, testName } = await import(`./${process.env.CONFIG_FILE}`)
const tenant = "loadTest";
const host = "http://localhost:3476";
const baseUrl = `${process.env.PERMIFY_HOST || host}/v1/tenants/${tenant}`;

const sum = { user: 0 }
const arrayRange = (start, length, max) => Array.from({ length }, (value, index) => ((start + index) % max || max).toString());

async function updatePermify(entityType, relation, entityPerUser, relationships) {
    const tuplesSize = 100;
    const chunks = [];

    for (let i = 0; i < relationships.length; i += tuplesSize) {
        chunks.push(relationships.slice(i, i + tuplesSize));
    }

    const results = chunks.map((tuples) => ({
        metadata: {
            schema_version: "",
        },
        tuples
    }));

    const batchSize = 50;
    const totalResults = results.length;
    let completedResults = 0;
    for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        await Promise.all(batch.map(req => axios.post(baseUrl + "/relationships/write", req)));
        completedResults += batch.length;
        const progress = Math.floor((completedResults / totalResults) * 100);
        console.log(`User ${relation} on ${entityPerUser} ${entityType} Progress: ${progress}%`);
    }
}

async function generateRelationshipsData(usersSize, relation, entityType, entityPerUser) {
    const { user } = entities;
    // let usersIds = getEntityIdsChunk(user, usersSize);
    const usersIds = arrayRange(user.currentId, usersSize, user.count)
    user.currentId = Number(usersIds[usersIds.length - 1]) + 1
    let initialData = [];
    sum[entityType] = sum[entityType] ? sum[entityType] + (usersIds.length * entityPerUser) : usersIds.length * entityPerUser;
    sum.user += usersIds.length
    usersIds.forEach(userId => {
        // let entitiesIds = getEntityIdsChunk(entities[entityType], entityPerUser);
        const entity = entities[entityType]
        const entitiesIds = arrayRange(entity.currentId, entityPerUser, entity.count)
        entity.currentId = Number(entitiesIds[entitiesIds.length - 1]) + 1
        for (let index = 0; index < entityPerUser; index++) {
            let data = {
                entity: {
                    type: entityType,
                    id: entitiesIds[index]
                },
                relation: relation,
                subject: {
                    type: 'user',
                    id: userId,
                    relation: ''
                }
            };

            initialData.push(data);
        }
    });
    await updatePermify(entityType, relation, entityPerUser, initialData);
}

async function saveDataToFile(data, filePath) {
    try {
        const fileContent = `export default ${JSON.stringify(data)};`;
        await fs.promises.writeFile(filePath, fileContent);
        console.log(`File ${filePath} saved successfully.`);
    } catch (error) {
        console.error('Error saving files:', error);
    }
}

try {

    await Promise.all(relationshipsGroups.map(group => generateRelationshipsData(group.users, group.relation, group.entity, group.entityPerUser)))
    const filePath = process.env.SUMMARY_FILE;
    await saveDataToFile(sum, filePath);
    console.log('File saved successfully.');
} catch (error) {
    console.log(error.message)
}
