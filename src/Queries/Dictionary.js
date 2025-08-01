// Mock Dictionary queries for the unified dashboard
const Dictionary = {
  // Activity data query (social interactions)
  getSocialInteractions: `
    query GetSocialInteractions($communityId: String!) {
      getSocialInteractions(communityId: $communityId) {
        ID
        data {
          body
          languages
        }
        from
        fromId
        fromPseudo
        title
        to
        toPseudo
        type
        view
        when
        __typename
      }
    }
  `,

  // Buildson links query
  buildsonLinks: `
    query BuildsonLinks($communityId: String!) {
      buildsonLinks(communityId: $communityId) {
        created
        from
        id
        to
        type
        __typename
        _from {
          authors
        }
        _to {
          authors
        }
      }
    }
  `,

  // Contributions query
  searchContributions: `
    query SearchContributions($query: SearchQuery!) {
      searchContributions(query: $query) {
        id
        _id
        title
        created
        authors
        type
        data {
          body
        }
        view
        __typename
      }
    }
  `,

  // Get links from ID (for view filtering)
  getLinksFromId: `
    query GetLinksFromId($fromId: String!) {
      getLinksFromId(fromId: $fromId) {
        created
        from
        id
        to
        type
        __typename
        _from {
          authors
        }
        _to {
          authors
        }
      }
    }
  `,

  // Get object by ID (for fetching note details)
  getKObjectById: `
    query GetKObjectById($id: String!) {
      getKObjectById(id: $id) {
        id
        _id
        title
        created
        authors
        type
        data {
          body
        }
        view
        __typename
      }
    }
  `
};

export default Dictionary;