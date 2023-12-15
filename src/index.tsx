import { Action, ActionPanel, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { $ } from 'zx';
import { Process } from "./types";
import { $withoutEscaping } from "./utils";

$.shell = '/bin/zsh'
$.env.PATH = process.env.PATH + ':/usr/sbin'

export default function Command() {
  const [input, setInput] = useState("3000");
  const [processList, setProcessList] = useState<Process[]>([]);

  const ports = useMemo(() => {
    const ports = input.split(' ');
    return ports ?? [];
  }, [input])

  useEffect(() => {
    console.log(`ports: ${ports}`);

    if (ports.length === 0) {
      return;
    }

    ports.forEach((s) => {
      $withoutEscaping`lsof -i:${s}`.then((output) => {
        console.log('s', s);
        console.log(output.stdout);

        let lines = output.stdout.trim().split('\n').slice(1);

        const data = lines.map(line => {
          const [command, pid, user, fd, type, device, sizeOff, node, ...nameParts] = line.trim().split(/\s+/);
          const name = nameParts.join(' ');
          return { command, pid, user, fd, type, device, sizeOff, node, name };
        });
        console.log(data);

        setProcessList([...processList, ...data]);
       });
    });
   }, [ports])

  return (
    <List
      searchText={input}
      onSearchTextChange={setInput}
      navigationTitle="Search Beers"
      searchBarPlaceholder="Input port your want kill, Enter to kill"
    >
      {processList.length === 0 ? <List.EmptyView /> : processList.map((item, index) => {
        return <List.Item
          key={index}
          title={item.command ?? ''}
          subtitle={item.name}
          accessories={[{text: item.user},{text: item.type}, {text: item.pid}]}
          actions={
            <ActionPanel>
              <Action title="Select" onAction={() => { }} />
            </ActionPanel>
          }
        />
      })}
    </List>
  );
}