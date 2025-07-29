import { gql } from '@apollo/client';

const Dictionary = {
  getSocialInteractions: gql`
    query GetSocialInteractions($communityId: String!) {
      getSocialInteractions(communityId: $communityId) {
        id
        type
        when
        from
        fromId
        fromPseudo
        to
        toId
        toPseudo
        view
        content
      }
    }
  `
};

export default Dictionary;