import http from 'k6/http';
import { check } from 'k6';
import {
    randomIntBetween,
    randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

let sum;
const loadConfig = () => {
    sum = require(`${__ENV.SUMMARY_FILE}`).default;
    return require(`${__ENV.CONFIG_FILE}`);
}

const { entitiesTypes, relations, actions, entities, relationshipsGroups, scenarios, testName } = loadConfig();

const tenant = "loadTest";
const host = "http://localhost:3476";
const baseUrl = `${__ENV.PERMIFY_HOST || host}/v1/tenants/${tenant}`;



export const options = {
    ext: {
        loadimpact: {
            projectID: '3645457',
            name: testName,
        },
    },
    setupTimeout: '10m',
    thresholds: {
        'http_req_duration{type:CHECK}': ['p(90) < 400'],
        'http_req_duration{type:LOOKUP}': ['p(90) < 400'],
        'http_req_duration{type:WRITE}': ['p(90) < 400'],
        'http_req_failed{type:CHECK}': ["rate<0.01"],
        'http_req_failed{type:WRITE}': ["rate<0.01"],
        'http_req_failed{type:LOOKUP}': ["rate<0.01"],
        // http_req_failed: ['rate<0.01'],
        // 'checks{check:lookup}': ['rate>0.9'],
        // 'checks{check:allowed}': ['rate<0.6']
    },
    scenarios
};

export function setup() {
    console.log({ baseUrl, testName });
    // relationshipsGroups.map(group => generateRelationshipsData(group.users, group.relation, group.entity, group.entityPerUser))
    return sum;
}

const checkStatus = (res) => check(res, { 'is status 200': (r) => r.status === 200 }, { check: "status" });
const checkAllowed = (res) => check(res, { 'is allowed': (r) => res.can === "RESULT_ALLOWED" }, { check: "allowed" });
const checkDenied = (res) => check(res, { 'is denied': (r) => res.can === "RESULT_DENIED" }, { check: "denied" });
const checkCacheHit = (res) => check(res, { 'is cache hit': (r) => res.metadata.check_count === 1 }, { check: "cache" });

export function deleteRelationship() {
    const entity = randomItem(entitiesTypes);
    const id = randomIntBetween(1, Math.min(sum[entity], entities[entity].count)).toString()
    const requestBody = {
        metadata: {
            schema_version: "",
        },
        filter: {
            entity: {
                type: entity,
                ids: [id],
            },
            relation: randomItem(relations),
            subject: {
                type: "user",
                ids: [id],
            },
        },
    };
    const res = http.post(baseUrl + "/relationships/delete", JSON.stringify(requestBody), { tags: { type: 'WRITE' } });
}

export function checkPermission(sum) {
    const entity = randomItem(entitiesTypes);
    const id = randomIntBetween(1, Math.min(sum[entity], entities[entity].count)).toString()
    const requestBody = {
        metadata: {
            schema_version: "",
            depth: 100
        },
        entity: {
            type: entity,
            id
        },
        permission: randomItem(actions),
        subject: {
            type: "user",
            id
        }
    };
    const res = http.post(baseUrl + "/permissions/check", JSON.stringify(requestBody), { tags: { type: 'CHECK' } });
    checkStatus(res);
    checkAllowed(JSON.parse(res.body));
    checkDenied(JSON.parse(res.body));
    checkCacheHit(JSON.parse(res.body));
}

export function lookupEntity(sum) {
    const entity = randomItem(entitiesTypes);
    const requestBody = {
        metadata: {
            schema_version: "",
            depth: 100
        },
        entity_type: entity,
        permission: randomItem(actions),
        subject: {
            type: "user",
            id: randomIntBetween(1, Math.min(sum.user, entities[entity].count)).toString()
        }
    };
    const res = http.post(baseUrl + "/permissions/lookup-entity", JSON.stringify(requestBody), { tags: { type: 'LOOKUP' } });
    checkStatus(res);
    check(res, {
        'entity > 0': (r) => {
            const res = JSON.parse(r.body)
            return res.entity_ids.length
        },
        'entity = 0': (r) => {
            const res = JSON.parse(r.body)
            return res.entity_ids.length === 0;
        },
    }, { check: "lookup" });
}

export function writeRelationshipRandom() {
    const requestBody = {
        metadata: {
            schema_version: "",
        },
        tuples: [{
            entity: {
                type: randomItem(entitiesTypes),
                id: randomIntBetween(1, 1000000).toString(),
            },
            relation: randomItem(relations),
            subject: {
                type: "user",
                id: randomIntBetween(1, 1000000).toString(),
            },
        }],
    };
    const res = http.post(baseUrl + "/relationships/write", JSON.stringify(requestBody), { tags: { type: 'WRITE' } });
}

export function checkPermissionRandom() {
    const requestBody = {
        metadata: {
            schema_version: "",
            depth: 100
        },
        entity: {
            type: randomItem(entitiesTypes),
            id: randomIntBetween(1, 1000000).toString(),
        },
        permission: randomItem(actions),
        subject: {
            type: "user",
            id: randomIntBetween(1, 1000000).toString(),
        }
    };
    const res = http.post(baseUrl + "/permissions/check", JSON.stringify(requestBody), { tags: { type: 'CHECK' } });
    // console.log(res)
    checkStatus(res);
    checkAllowed(JSON.parse(res.body));
    checkDenied(JSON.parse(res.body));
    checkCacheHit(JSON.parse(res.body));
}
// export function handleSummary(data) {
//     return {
//         'summary.json': JSON.stringify(data), //the default data object
//         "summary.html": htmlReport(data),
//     };
// }

// function getEntityIdsChunk(entity, chunkSize) {
//     let ids = entity.ids.slice(entity.currentId, entity.currentId + chunkSize)
//     if (ids.length < chunkSize) {
//         const remainingSize = chunkSize - ids.length;
//         ids = [...ids, ...entity.ids.slice(0, remainingSize)];
//     }
//     entity.currentId = entity.currentId + chunkSize;
//     return ids;
// }

// function getRangeIds(startId, endId, maxId) {
//     const range = [];

//     for (let i = startId; i <= endId; i++) {
//         range.push(i < maxId ? i : i % maxId);
//     }

//     return range;
// }

const arrayRange = (start, length, max) => Array.from({ length }, (value, index) => ((start + index) % max || max).toString());

function updatePermify(entityType, relation, entityPerUser, relationships) {
    const chunkSize = 100;
    const chunks = [];

    for (let i = 0; i < relationships.length; i += chunkSize) {
        chunks.push(relationships.slice(i, i + chunkSize));
    }

    const results = chunks.map((chunk) => {
        return {
            method: 'POST',
            url: baseUrl + "/relationships/write",
            body: JSON.stringify({
                metadata: {
                    schema_version: "",
                },
                tuples: chunk
            })
        }
    });

    const batchSize = 50;
    const totalResults = results.length;
    let completedResults = 0;
    for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        http.batch(batch);

        completedResults += batch.length;
        const progress = Math.floor((completedResults / totalResults) * 100);
        console.log(`User ${relation} on ${entityPerUser} ${entityType} Progress: ${progress}%`);
    }

}

function generateRelationshipsData(usersSize, relation, entityType, entityPerUser) {
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
    updatePermify(entityType, relation, entityPerUser, initialData);
    // return initialData;
}
