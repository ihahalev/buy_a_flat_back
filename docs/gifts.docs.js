const giftsEndpoints = {
  '/gifts/unpack': {
    put: {
      tags: ['gifts'],
      summary: 'Put info',
      description: 'gifts router',
      operationId: 'giftsLoggedUser',
      produces: ['application/json'],
      parameters: [
        {
          in: 'header',
          name: 'authorization',
          description: 'authorization',
          required: true,
          type: 'string',
        },
      ],
      responses: {
        401: {
          description: 'user not authorized',
        },
        403: {
          description: 'user not a member of family',
        },
        200: {
          description: 'decrement giftsForUnpacking & increment giftsUnpacked values',
        },
      },
    },
  },
};

const giftsDefinitions = {
  Gifts: {
    type: 'object',
    properties: {
      gifts: {
        type: 'object',
        properties: {
          giftsForUnpacking: {
            type: 'number',
          },
          giftsUnpacked: {
            type: 'number',
          },
        },
      },
    },
    xml: {
      name: 'Gifts',
    },
  },

};

exports.giftsEndpoints = giftsEndpoints;
exports.giftsDefinitions = giftsDefinitions;
