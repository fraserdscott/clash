import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client";
import React from "react";
import Address from "../components/Address";
import { Link } from "react-router-dom";

const GOTCHI_NAME_GQL = gql`
  query ($id: ID) {
    aavegotchi(id: $id) {
      id
      name
    }
}`;


const GOTCHI_SVG_GQL = gql`
  query ($id: ID) {
    aavegotchi(id: $id) {
      id
      svg
    }
}`;

const ORC_GQL = gql`
  query ($_id: Int){
    orc(filter: { _id: $_id }) {
      _id
      metadata {
        name
        image
      }
    }
}`;

const nameClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic",
  cache: new InMemoryCache(),
});

const svgClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/froid1911/aavegotchi-svg",
  cache: new InMemoryCache(),
});

const orcClient = new ApolloClient({
  uri: "https://open-api.etherorcs.com/api/graphql",
  cache: new InMemoryCache(),
});

export function GotchiWidget(props) {
  const { data } = useQuery(GOTCHI_SVG_GQL, { client: svgClient, variables: { id: props.p.tokenID } });
  const { data: dataName } = useQuery(GOTCHI_NAME_GQL, { client: nameClient, variables: { id: props.p.tokenID } });

  return (
    <div style={{ border: "solid", width: 300, height: 350 }}>
      {
        data && data.aavegotchi ?
          <div style={{ margin: 20, marginBottom: 0, border: "solid" }}>
            <div
              dangerouslySetInnerHTML={{
                __html: data.aavegotchi.svg,
              }}
            />
          </div>
          : (
            <img style={{ border: "solid" }} width="250" src="https://app.aavegotchi.com/images/portals/h1_closed.svg" />
          )
      }
      <div>
        <h3>{dataName && dataName.aavegotchi ? dataName.aavegotchi.name : `Gotchi #${props.p.tokenID}`}</h3>
        Owner: <Address address={props.p.owner.id} fontSize={14} />
      </div>
    </div>
  );
}

export function OrcWidget(props) {
  const { data } = useQuery(ORC_GQL, { client: orcClient, variables: { _id: parseInt(props.p.tokenID) } });

  return (
    <div style={{ border: "solid", width: 300, height: 350 }}>
      {<img style={{ border: "solid" }} width="250" src={data && data.orc ? data.orc.metadata.image : ""} />}
      <div>
        <h3>{data && data.orc ? data.orc.metadata.name : `Orc #${props.p.tokenID}`}</h3>
        Owner: <Address address={props.p.owner.id} fontSize={14} />
      </div>
    </div>
  );
}

export function ComethWidget(props) {
  return (
    <div style={{ border: "solid", width: 300, height: 350 }}>
      <img style={{ border: "solid" }} width="200" src={`https://images.service.cometh.io/${props.p.tokenID}.png`} />
      <div>
        <h3>Cometh #{props.p.tokenID}</h3>
        Owner: <Address address={props.p.owner.id} fontSize={14} />
      </div>
    </div>
  );
}

export function TokenWidget(props) {
  return (
    <div>{
      props.writeContracts.Aavegotchi && props.p.contract.id === props.writeContracts.Aavegotchi.address.toLowerCase() ? (
        <GotchiWidget p={props.p} writeContracts={props.writeContracts} />
      ) : props.writeContracts.Proxy && props.p.contract.id === props.writeContracts.Proxy.address.toLowerCase() ? (
        <OrcWidget p={props.p} writeContracts={props.writeContracts} />
      ) : (
        <ComethWidget p={props.p} writeContracts={props.writeContracts} />
      )
    }</div>
  );
};

export function TokenWidgetEmpty() {
  return <div style={{ border: "solid" }}>
    <img
      style={{ border: "solid" }}
      width="200"
      src="https://upload.wikimedia.org/wikipedia/commons/4/46/Question_mark_%28black%29.svg"
    />
    <h2>?</h2>
  </div>
}

function Tokens(props) {
  const EXAMPLE_GRAPHQL = gql`
  {
    tokens(orderBy: tokenIndex, first: 32) {
        id
        tokenID
        contract {
          id
        }
        owner {
          id
        }
    }
  }
  `;

  const { loading, data, error } = useQuery(EXAMPLE_GRAPHQL, { pollInterval: 2500 });

  return (
    <>
      <h1>All NFTs</h1>
      {
        error ? error.toString() :
          loading ? null
            : (
              <div style={{ display: "flex", flexWrap: 'wrap', justifyContent: 'center' }}>
                {data.tokens.length === 0
                  ? "There are no NFT's yet."
                  : data.tokens.map(p => (
                    <Link to={`/token/${p.id}`}>
                      <div style={{ margin: 4 }}>
                        <TokenWidget p={p} writeContracts={props.writeContracts} />
                      </div>
                    </Link>
                  ))}
              </div>
            )
      }
    </>
  );
}

export default Tokens;
