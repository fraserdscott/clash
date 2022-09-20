import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client";
import React from "react";
import Address from "../components/Address";
import { Link } from "react-router-dom";
import { tokenToName } from "./MatchWidget";
import { useState } from "react";
import { useEffect } from "react";

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

const nameClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic",
  cache: new InMemoryCache(),
});

const svgClient = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/froid1911/aavegotchi-svg",
  cache: new InMemoryCache(),
});

export function GotchiWidget(props) {
  const { data } = useQuery(GOTCHI_SVG_GQL, { client: svgClient, variables: { id: props.p.tokenID } });
  const { data: dataName } = useQuery(GOTCHI_NAME_GQL, { client: nameClient, variables: { id: props.p.tokenID } });

  return (
    <div style={{ border: "solid", width: 300, height: 350 }}>
      {
        data && data.aavegotchi ?
          <div
            dangerouslySetInnerHTML={{
              __html: data.aavegotchi.svg,
            }}
          />
          : <img src="https://app.aavegotchi.com/images/portals/h1_closed.svg" />}
      <div>
        <h3>{dataName && dataName.aavegotchi ? dataName.aavegotchi.name : tokenToName(props.p)}</h3>
        Owner: <Address address={props.p.owner.id} fontSize={14} />
      </div>
    </div>
  );
}

export function TokenWidget(props) {
  const [image, setImage] = useState("");
  const { data } = useQuery(GOTCHI_SVG_GQL, { client: svgClient, variables: { id: props.p.tokenID } });

  useEffect(() => {
    async function fetchData() {
      if (props.writeContracts.EtherOrcsPoly && data) {
        if (props.p.contract.id === props.writeContracts.SpaceShips.address.toLowerCase()) {
          setImage(`https://images.service.cometh.io/${props.p.tokenID}.png`);
        } else if (props.p.contract.id === props.writeContracts.EtherOrcsPoly.address.toLowerCase()) {
          // Try find subgraph
          const dataURI = await props.writeContracts.EtherOrcsPoly.tokenURI(props.p.tokenID);

          const json = atob(dataURI.substring(29));
          const result = JSON.parse(json);

          setImage(result.image);
        } else {
          setImage("");
        }
      }
    }
    fetchData();
  }, [data, props.p.contract.id, props.p.tokenID, props.writeContracts.EtherOrcsPoly, props.writeContracts.SpaceShips]);

  return (
    <div style={{ border: "solid", width: 300, height: 350 }}>
      <img style={{ border: "solid" }} width="200" src={image} />
      <div>
        <h3>{tokenToName(props.p)}</h3>
        Owner: <Address address={props.p.owner.id} fontSize={14} />
      </div>
    </div>
  );
}

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
    tokens(orderBy: tokenIndex, first: 20) {
        id
        tokenID
        contract {
          id
          name
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
                        {props.writeContracts.Aavegotchi && p.contract.id === props.writeContracts.Aavegotchi.address.toLowerCase() ? (
                          <GotchiWidget p={p} writeContracts={props.writeContracts} />
                        ) : (
                          <TokenWidget p={p} writeContracts={props.writeContracts} />
                        )}
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
