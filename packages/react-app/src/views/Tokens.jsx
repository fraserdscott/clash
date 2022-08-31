import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client";
import React from "react";
import Address from "../components/Address";
import { Link } from "react-router-dom";
import { tokenToName } from "./MatchWidget";
import { useState } from "react";
import { useEffect } from "react";

const GOTCHI_QL = gql`query($id: ID){
  aavegotchi(id: $id) {
    id
    svg
  }
}`

const client = new ApolloClient({
  uri: "https://api.thegraph.com/subgraphs/name/froid1911/aavegotchi-svg",
  cache: new InMemoryCache(),
});

export function TokenWidget(props) {
  const [image, setImage] = useState("");
  const [gotchi, setGotchi] = useState(false);
  const hi = useQuery(GOTCHI_QL, { client, variables: { id: props.p.tokenID } });

  useEffect(() => {
    async function fetchData() {
      console.log(hi.data)
      if (props.writeContracts.EtherOrcsPoly && hi.data) {
        if (props.p.contract.id === props.writeContracts.SpaceShips.address.toLowerCase()) {
          setImage(`https://images.service.cometh.io/${props.p.tokenID}.png`);
        } else if (props.p.contract.id === props.writeContracts.Aavegotchi.address.toLowerCase()) {
          if (hi.data.aavegotchi) {
            const image = hi.data.aavegotchi.svg;

            setGotchi(true);
            setImage(image);
          } else {
            setImage("https://app.aavegotchi.com/images/portals/h1_closed.svg");
          }
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
  }, [
    hi,
    props.p.contract.id,
    props.p.tokenID,
    props.writeContracts.Aavegotchi,
    props.writeContracts.EtherOrcsPoly,
    props.writeContracts.SpaceShips,
  ]);

  return <div style={{ border: "solid", width: 300, height: 350 }}>
    {gotchi ? <div dangerouslySetInnerHTML={{ __html: image }} /> :
      <img
        style={{ border: "solid" }}
        width="200"
        src={image}
      />}
    <div>
      <h3>{tokenToName(props.p)}</h3>
      Owner: <Address address={props.p.owner.id} fontSize={14} />
    </div>
  </div>
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
