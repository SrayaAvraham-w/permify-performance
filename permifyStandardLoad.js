import http from 'k6/http';
import { check } from 'k6';
import {
    randomIntBetween,
    randomItem,
} from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
// import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const tenant = "loadTest";
const host = "http://localhost:3476";
const baseUrl = `${__ENV.HOST || host}/v1/tenants/${tenant}`;
const entitiesTypes = ["site", "subscription"];
const relations = ["viewer", "manager"];
const actions = ["edit", "view"];

const entities = {
    user: {
        ids: Array.from({ length: 50000 }, (_, i) => (i + 1).toString()),
        // count: 5000,
        currentId: 0
    },
    site: {
        ids: Array.from({ length: 300 }, (_, i) => (i + 1).toString()),
        currentId: 0
    },
    subscription: {
        ids: Array.from({ length: 15000 }, (_, i) => (i + 1).toString()),
        currentId: 0
    }
}

const relationshipsGroups = [
    {
        users: 1000,
        entity: "subscription",
        entityPerUser: 2,
        relation: "manager"
    },
    {
        users: 2000,
        entity: "site",
        entityPerUser: 1,
        relation: "viewer"
    },
    {
        users: 5000,
        entity: "subscription",
        entityPerUser: 1,
        relation: "manager"
    }
];

export const options = {
    thresholds: {
        'http_req_duration{type:CHECK}': ['p(90) < 400'],
        'http_req_duration{type:LOOKUP}': ['p(90) < 400'],
        'http_req_duration{type:WRITE}': ['p(90) < 400'],
    },
    scenarios: {
        writeRelationshipRandom: {
            executor: "constant-arrival-rate",
            exec: "writeRelationshipRandom",
            preAllocatedVUs: 50,
            duration: '1m',
            rate: 50,
            timeUnit: '1m',
        },
        checkPermissionRandom: {
            executor: "constant-arrival-rate",
            exec: "checkPermissionRandom",
            preAllocatedVUs: 10,
            duration: '1m',
            rate: 10,
            timeUnit: '1m',
        },
        checkPermission: {
            executor: "constant-arrival-rate",
            exec: "checkPermission",
            preAllocatedVUs: 100,
            duration: '1m',
            rate: 1000,
            timeUnit: '1m',
        },
        lookupEntity: {
            executor: "constant-arrival-rate",
            exec: "lookupEntity",
            preAllocatedVUs: 100,
            duration: '1m',
            rate: 100,
            timeUnit: '1m',
        },
    },
};

export function setup() {

    const relationships = [].concat(...relationshipsGroups.map(group =>
        generateInitialData(group.users, group.relation, group.entity, group.entityPerUser)
    ))

    const chunkSize = 100;
    const chunks = [];

    for (let i = 0; i < relationships.length; i += chunkSize) {
        chunks.push(relationships.slice(i, i + chunkSize));
    }
    const totalRequests = chunks.length;
    let completedRequests = 0;

    const results = chunks.map((chunk) => {
        const requestBody = {
            metadata: {
                schema_version: "",
            },
            tuples: chunk
        }
        const res = http.post(baseUrl + "/relationships/write", JSON.stringify(requestBody));
        completedRequests++;
        const progress = Math.floor((completedRequests / totalRequests) * 100);
        const progressBar = "[" + "=".repeat(progress) + "-".repeat(100 - progress) + "]";
        const progressText = `${progress.toString().padStart(3, "0")}/${totalRequests.toString().padStart(3, "0")} req`;
        console.log(`${progressBar} ${progressText}`);
    });

    return relationships;

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
    http.post(baseUrl + "/relationships/write", requestBody, { tags: { type: 'WRITE' } });
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
    check(res, {
        'is status 200': (r) => r.status === 200,
        'is allowed': (r) => {
            const res = JSON.parse(r.body)
            return res.can === "RESULT_ALLOWED"
        },
        'is denied': (r) => {
            const res = JSON.parse(r.body)
            return res.can === "RESULT_DENIED"
        },
        'is cache hit': (r) => {
            const res = JSON.parse(r.body)
            return res.metadata.check_count === 1
        },
    });
}

export function checkPermission(relationships) {
    const rel = randomItem(relationships);
    const requestBody = {
        metadata: {
            schema_version: "",
            depth: 100
        },
        entity: rel.entity,
        permission: randomItem(actions),
        subject: rel.subject
    };
    const res = http.post(baseUrl + "/permissions/check", JSON.stringify(requestBody), { tags: { type: 'CHECK' } });
    check(res, {
        'is status 200': (r) => r.status === 200,
        'is allowed': (r) => {
            const res = JSON.parse(r.body)
            return res.can === "RESULT_ALLOWED"
        },
        'is denied': (r) => {
            const res = JSON.parse(r.body)
            return res.can === "RESULT_DENIED"
        },
        'is cache hit': (r) => {
            const res = JSON.parse(r.body)
            return res.metadata.check_count === 1
        },
    });
}

export function lookupEntity(relationships) {
    const rel = randomItem(relationships);
    const requestBody = {
        metadata: {
            schema_version: "",
            depth: 100
        },
        entity_type: rel.entity.type,
        permission: randomItem(actions),
        subject: rel.subject
    };
    const res = http.post(baseUrl + "/permissions/lookup-entity", JSON.stringify(requestBody), { tags: { type: 'LOOKUP' } });
    // console.log(res)
    check(res, {
        'is status 200': (r) => r.status === 200,
        'entity > 0': (r) => {
            const res = JSON.parse(r.body)
            return res.entity_ids.length
        },
        'entity = 0': (r) => {
            const res = JSON.parse(r.body)
            return res.entity_ids.length === 0;
        },
    });
}

// export function handleSummary(data) {
//     return {
//         'summary.json': JSON.stringify(data), //the default data object
//         "summary.html": htmlReport(data),
//     };
// }

function getEntityIdsChunk(entity, chunkSize) {
    let ids = entity.ids.slice(entity.currentId, entity.currentId + chunkSize)
    if (ids.length < chunkSize) {
        const remainingSize = chunkSize - ids.length;
        ids = [...ids, ...entity.ids.slice(0, remainingSize)];
    }
    entity.currentId = entity.currentId + chunkSize;
    return ids;
}

function getRangeIds(startId, endId, maxId) {
    const range = [];
  
    for (let i = startId; i <= endId; i++) {
      range.push(i < maxId ? i : i % maxId);
    }
  
    return range;
  }

function generateInitialData(usersSize, relation, entityType, entityPerUser) {
    const { user } = entities;
    let usersIds = getEntityIdsChunk(user, usersSize);
    let initialData = [];

    usersIds.forEach(userId => {
        let entitiesIds = getEntityIdsChunk(entities[entityType], entityPerUser);

        for (let index = 1; index <= entityPerUser; index++) {
            let data = {
                entity: {
                    type: entityType,
                    id: entitiesIds[index - 1]
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

    return initialData;
}
