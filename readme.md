
# gRPC server-client programming on node runtime.

제가 node.js로 만든 example 코드입니다.  
[gRPC github](https://github.com/grpc/grpc/tree/master/examples/node)에도 node.js 예제 코드가 있으니 그것도 보시면 많은 도움이 되실겁니다.

네 종류의 rpc method에 대해 예제 코드를 만들어봤습니다.

### 1) unary rpc
---
unary 방식에서 클라이언트가 서버 응답을 처리하는(받는) 로직은 두 가지입니다.  
  1. 자신(클라이언트)의 콜백함수 내부에서 처리하는 방식.
  2. 1번의 콜백함수를 promisify하여 처리하는 방식.

  1번의 장단점 : 쉽다. 그러나 callback hell이 발생할 여지가 있다.  
  2번의 장단점 : callback hell이 발생하지 않는다. 그러나 promisification으로 인해 코드가 복잡해질 수 있다.

  1번은 gRPC공식 깃헙에 예제로 있습니다. 저는 2번을 보여드리겠습니다. promise화 한 후에 이를 async, await으로 처리합니다.

### 2) client streaming rpc
---
클라이언트가 동일한 `type`의 데이터를 서버에 여러번 보내는 방식입니다. 대표적으로 파일 업로드를 생각해볼 수 있을겁니다.

log collector와 pipeline monitoring을 예제로 만들어봤습니다.

### 3) server streaming rpc
---
이번엔 서버가 동일한 `type`의 데이터를 클라이언트로 여러번 보내는 방식입니다. 대표적으로 파일 다운로드를 생각해볼 수 있을겁니다.

file download를 예제로 만들어봤습니다.

### 4) bidirectional streaming rpc
---


위의 그림 기억나시나요? 그림에서 빨간색, 초록색 글씨를 잘 보시면 서버와 클라이언트 모두 read, write operation이 가능합니다.

A와 B가 있다고 가정해보겠습니다.  
A는 B로부터 메시지를 `read`할 수 있어야하며, 동시에
A는 B에게 메시지를 `write`할 수 있어야합니다.

B도 마찬가지입니다.

bidirectional 스트림으로 채팅 프로그램을 만들 수 있을겁니다.

chatting 프로그램을 예제로 만들어봤습니다.

## PREREQUISITES

:heavy_exclamation_mark: node v10 이상이 설치되어 있어야 합니다.

## INSTALL

1. git clone

2. npm install

