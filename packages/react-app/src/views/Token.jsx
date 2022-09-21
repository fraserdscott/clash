import { gql, useQuery } from "@apollo/client";
import React from "react";
import { useLocation } from "react-router-dom";
import { TokenWidget, TokenWidgetEmpty } from "./Tokens";
import MatchWidget from "./MatchWidget";
import { tokenToName } from "./MatchWidget";
import { matchDate } from "./MatchWidget";
import { Button } from "antd";
import { useState } from "react";
import { useEffect } from "react";

const TOKEN_GRAPHQL = gql`
  query getToken($id: ID!) {
    token(id: $id) {
      id
      contract {
        id
        offset
      }
      tokenID
      tokenIndex
      owner {
        id
      }
    }
    epoches {
      id
      random
      matches {
        id
      }
    }
    battler(id: 0) {
      id
      matchInterval
      reward
      startTimestamp
      globalSupply
    }
    tokenContracts {
      id
      offset
    }
  }
`;

function Token(props) {
  const [stats, setStats] = useState(["...", "...", "...", "..."]);

  const location = useLocation();
  const id = location.pathname.split("/")[2];
  const { loading, data, error } = useQuery(TOKEN_GRAPHQL, { pollInterval: 2500, variables: { id } });

  useEffect(() => {
    async function fetchData() {
      if (data && data.token && props.writeContracts.Battler) {
        props.writeContracts.Battler.tokenStats(data.token.contract.id, data.token.tokenID).then(x => setStats(x));
      }
    }
    fetchData();
  }, [data, props.writeContracts.Battler]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <div>
        <h1>{tokenToName(data.token)}</h1>
        <div style={{ border: "solid", display: "flex", flexDirection: "column", padding: 12 }}>
          <h2>Overview</h2>
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <TokenWidget p={data.token} writeContracts={props.writeContracts} />
            <div style={{ display: "flex", flexDirection: "column", border: "solid", padding: 12, width: 300 }}>
              <h3>Attributes</h3>
              <div style={{ fontSize: 16 }}>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                  <div>❤️ Health</div> <div>{stats[0].toString()}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                  <div>🗡️ Damage</div> <div>{stats[1].toString()}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                  <div>🔃 Attack recover time</div> <div>{stats[2].toString()}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                  <div>❤️‍🩹 Health per turn</div> <div>{stats[3].toString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2>Matches</h2>
        {[0, 1, 2, 3, 4, 5].map(i =>
          data.epoches.find(e => e.id === i.toString()) ? (
            <div>
              <MatchWidget
                battler={data.battler}
                tokenContracts={data.tokenContracts}
                epoch={data.epoches.find(e => e.id === i.toString())}
                p={data.token}
                tx={props.tx}
                writeContracts={props.writeContracts}
              />
            </div>
          ) : (
            <div style={{ borderStyle: "solid" }}>
              <h2>{matchDate(i, data.battler).toUTCString()}</h2>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <TokenWidgetEmpty />
                vs
                <TokenWidgetEmpty />
              </div>
              {Date.now() >= matchDate(i, data.battler) ? (
                <Button
                  style={{ marginTop: 8 }}
                  onClick={async () => {
                    props.tx(await props.writeContracts.Battler.simulateEpoch(i, Math.floor(Math.random() * 100000)));
                  }}
                >
                  Request random seed
                </Button>
              ) : null}
            </div>
          ),
        )}
      </div>
    </>
  );
}

export default Token;
