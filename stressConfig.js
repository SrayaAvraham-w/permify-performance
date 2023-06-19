
const duration = '3m';
export const testName = "Stress";
export const entitiesTypes = ["site", "subscription"];
export const relations = ["viewer", "manager"];
export const actions = ["edit", "view"];

export const entities = {
    user: {
        count: 5000000,
        currentId: 1
    },
    site: {
        count: 30000,
        currentId: 1
    },
    subscription: {
        count: 1500000,
        currentId: 1
    }
}

export const relationshipsGroups = [
    {
        users: 150000,
        entity: "subscription",
        entityPerUser: 1,
        relation: "manager"
    },
    {
        users: 15000,
        entity: "subscription",
        entityPerUser: 2,
        relation: "manager"
    },
    {
        users: 5000,
        entity: "subscription",
        entityPerUser: 1,
        relation: "viewer"
    },
    {
        users: 3000,
        entity: "site",
        entityPerUser: 1,
        relation: "manager"
    },
    {
        users: 1500,
        entity: "site",
        entityPerUser: 1,
        relation: "viewer"
    },
];

export const scenarios = {
    checkPermission: {
        executor: "ramping-arrival-rate",
        exec: "checkPermission",
        preAllocatedVUs: 5,
        startRate: 100,
        timeUnit: '2s',
        stages: [
            { target: 300, duration: '30s' },
            { target: 600, duration: '90s' },
            { target: 700, duration: '30s' },
            { target: 60, duration: '1m' },
          ],
    },
    lookupEntity: {
        executor: "constant-arrival-rate",
        exec: "lookupEntity",
        preAllocatedVUs: 5,
        duration,
        rate: 100,
        timeUnit: '1m',
    },
    writeRelationshipRandom: {
        executor: "constant-arrival-rate",
        exec: "writeRelationshipRandom",
        preAllocatedVUs: 5,
        duration,
        rate: 50,
        timeUnit: '1m',
    },
    deleteRelationship: {
        executor: "constant-arrival-rate",
        exec: "deleteRelationship",
        preAllocatedVUs: 5,
        duration,
        rate: 50,
        timeUnit: '1m',
    },
    checkPermissionRandom: {
        executor: "constant-arrival-rate",
        exec: "checkPermissionRandom",
        preAllocatedVUs: 5,
        duration,
        rate: 10,
        timeUnit: '1m',
    }
}
