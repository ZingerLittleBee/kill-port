import { Action, ActionPanel, List, Toast, showToast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { $ } from 'zx';
import { Process } from "./types";
import { $withoutEscaping } from "./utils";

$.shell = '/bin/zsh'
$.env.PATH = process.env.PATH + ':/usr/sbin'

export default function Command() {
  const [input, setInput] = useState("");
  const [processList, setProcessList] = useState<Process[]>([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const ports = useMemo(() => input ? input.split(' ') : [], [input])

  const killByPid = async (pid: string) => {
    try {
      await $withoutEscaping`kill -9 ${pid}`;
      await showToast({ title: 'Success', style: Toast.Style.Success  });
    } catch (error) {
      await showToast({ title: error?.toString() ?? 'Failure', style: Toast.Style.Failure  });
    }
    setRefreshFlag(refreshFlag + 1)
  }

  useEffect(() => {
    let isMounted = true;
    if (ports.length === 0) return;
    const fetchProcesses = async () => {
      const allProcesses = [];
      for (const p of ports) {
        if (!p) continue;
        const port = parseInt(p);
        if (isNaN(port) || port < 0 || port > 65535) {
          await showToast({ title: "Only support input port number", style: Toast.Style.Failure  });
          continue
        }
        try {
          const output = await $withoutEscaping`lsof -i:${port}`;
          const lines = output.stdout.trim().split('\n').slice(1);
          const data = lines.map(line => {
            const [command, pid, user, fd, type, device, sizeOff, node, ...nameParts] = line.trim().split(/\s+/);
            const name = nameParts.join(' ');
            return { command, pid, user, fd, type, device, sizeOff, node, name };
          });
  
          allProcesses.push(...data);
        } catch (error) {
          console.error(`Error fetching process for port ${port}:`, error);
        }
      }
  
      if (isMounted) {
        setProcessList(allProcesses);
      }
    };
  
    fetchProcesses();
  
    return () => {
      isMounted = false;
    };
  }, [ports, refreshFlag]);

  return (
    <List
      searchText={input}
      onSearchTextChange={setInput}
      navigationTitle=""
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
              <Action title="Select" onAction={() => { item.pid && killByPid(item.pid) }} />
            </ActionPanel>
          }
        />
      })}
    </List>
  );
}