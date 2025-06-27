import { getSZTUUserInfo } from '@/web/support/outLink/api';
import { ChevronUpIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Divider,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Portal
} from '@chakra-ui/react';
import { type SZTUUserInfo } from '@fastgpt/service/support/permission/publish/thirdpartyAuth/sztu';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useMount } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import Cookie from 'cookie';
import { useRouter } from 'next/router';

const SZTUChatUserInfoBox = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<SZTUUserInfo>();

  const initSZTUUserInfo = async () => {
    const res = await getSZTUUserInfo();
    setUserInfo(res);
  };

  const exitSZTULogin = () => {
    // 清除 cookie中的 shareToken
    document.cookie = 'shareToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    const params = new URLSearchParams();
    params.set('redirectToLogin', 'true');
    params.set('entityId', 'rxc');
    params.set('redirctToUrl', `${location.href}`);
    location.href = `https://auth.sztu.edu.cn/idp/profile/OAUTH2/Redirect/GLO?${params.toString()}`;
  };

  useMount(() => {
    initSZTUUserInfo();
  });

  return (
    <Box margin={'0 2 2 2'}>
      <Divider />
      <Popover>
        <PopoverTrigger>
          <Button
            variant={'whitePrimary'}
            flex={['0 0 auto', 1]}
            w={'100%'}
            px={6}
            color={'primary.600'}
            borderRadius={'xl'}
            leftIcon={<MyIcon name={'user'} w={'18px'} />}
            justifyContent={'flex-start'}
            overflow={'hidden'}
            border={'none'}
            h={'44px'}
            onClick={() => {}}
          >
            {`${userInfo?.loginName || ''} ${userInfo?.displayName || ''}`}
            <ChevronUpIcon fontSize={18} marginLeft={'auto'} />
          </Button>
        </PopoverTrigger>
        <Portal>
          <PopoverContent w={'260px'}>
            <Button
              variant={'ghost'}
              flex={['0 0 auto', 1]}
              w={'100%'}
              px={6}
              borderRadius={'md'}
              justifyContent={'flex-start'}
              overflow={'hidden'}
              border={'none'}
              h={'44px'}
              onClick={exitSZTULogin}
            >
              {'退出登录'}
            </Button>
          </PopoverContent>
        </Portal>
      </Popover>
    </Box>
  );
};
export default SZTUChatUserInfoBox;
