import React, { useMemo } from 'react';
import { Box, Button, Flex, useTheme, IconButton, Divider } from '@chakra-ui/react';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useEditTitle } from '@/web/common/hooks/useEditTitle';
import { useRouter } from 'next/router';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useTranslation } from 'next-i18next';
import { useUserStore } from '@/web/support/user/useUserStore';
import MyMenu from '@fastgpt/web/components/common/MyMenu';
import { useContextSelector } from 'use-context-selector';
import { ChatContext } from '@/web/core/chat/context/chatContext';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { formatTimeToChatTime } from '@fastgpt/global/common/string/time';
import { ChatItemContext } from '@/web/core/chat/context/chatItemContext';
import { useChatStore } from '@/web/core/chat/context/useChatStore';
import PopoverConfirm from '@fastgpt/web/components/common/MyPopover/PopoverConfirm';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import { ThirdPartyAuthEnum } from '@fastgpt/global/support/outLink/constant';
import SZTUChatUserInfoBox from './share/SZTUChatUserInfoBox';
import MyImage from '@/components/MyImage';

type HistoryItemType = {
  id: string;
  title: string;
  customTitle?: string;
  top?: boolean;
  updateTime: Date;
};

const ChatHistorySlider = ({ confirmClearText }: { confirmClearText: string }) => {
  const theme = useTheme();
  const router = useRouter();

  const { t } = useTranslation();

  const { isPc } = useSystem();
  const { userInfo } = useUserStore();

  const { appId, chatId: activeChatId, source, outLinkAuthData } = useChatStore();
  const onChangeChatId = useContextSelector(ChatContext, (v) => v.onChangeChatId);
  const isLoading = useContextSelector(ChatContext, (v) => v.isLoading);
  const ScrollData = useContextSelector(ChatContext, (v) => v.ScrollData);
  const histories = useContextSelector(ChatContext, (v) => v.histories);
  const onDelHistory = useContextSelector(ChatContext, (v) => v.onDelHistory);
  const onClearHistory = useContextSelector(ChatContext, (v) => v.onClearHistories);
  const onUpdateHistory = useContextSelector(ChatContext, (v) => v.onUpdateHistory);

  const appName = useContextSelector(ChatItemContext, (v) => v.chatBoxData?.app.name);
  const appAvatar = useContextSelector(ChatItemContext, (v) => v.chatBoxData?.app.avatar);
  const showRouteToAppDetail = useContextSelector(ChatItemContext, (v) => v.showRouteToAppDetail);
  const setCiteModalData = useContextSelector(ChatItemContext, (v) => v.setCiteModalData);

  const isSZTUShared = useMemo(() => {
    return (
      outLinkAuthData?.thirdPartyAuth?.needAuth &&
      outLinkAuthData?.thirdPartyAuth?.authType === ThirdPartyAuthEnum.SZTU
    );
  }, [outLinkAuthData]);

  const concatHistory = useMemo(() => {
    const formatHistories: HistoryItemType[] = histories.map((item) => {
      return {
        id: item.chatId,
        title: item.title,
        customTitle: item.customTitle,
        top: item.top,
        updateTime: item.updateTime
      };
    });
    const newChat: HistoryItemType = {
      id: activeChatId,
      title: t('common:core.chat.New Chat'),
      updateTime: new Date()
    };
    const activeChat = histories.find((item) => item.chatId === activeChatId);

    return !activeChat ? [newChat].concat(formatHistories) : formatHistories;
  }, [activeChatId, histories, t]);

  // custom title edit
  const { onOpenModal, EditModal: EditTitleModal } = useEditTitle({
    title: t('common:core.chat.Custom History Title'),
    placeholder: t('common:core.chat.Custom History Title Description')
  });

  const canRouteToDetail = useMemo(
    () => appId && userInfo?.team.permission.hasWritePer && showRouteToAppDetail,
    [appId, userInfo?.team.permission.hasWritePer, showRouteToAppDetail]
  );

  return (
    <MyBox
      display={'flex'}
      flexDirection={'column'}
      w={'100%'}
      h={'100%'}
      bg={'white'}
      borderRight={['', theme.borders.base]}
      whiteSpace={'nowrap'}
    >
      {isPc && (
        <MyTooltip label={canRouteToDetail ? t('app:app_detail') : ''} offset={[0, 0]}>
          <Flex
            pt={5}
            pb={2}
            px={[2, 5]}
            alignItems={'center'}
            cursor={canRouteToDetail ? 'pointer' : 'default'}
            fontSize={'sm'}
            onClick={() =>
              canRouteToDetail &&
              router.push({
                pathname: '/app/detail',
                query: { appId }
              })
            }
          >
            <Avatar src={appAvatar} borderRadius={'md'} />
            <Box flex={'1 0 0'} w={0} ml={2} fontWeight={'bold'} className={'textEllipsis'}>
              {appName}
            </Box>
          </Flex>
        </MyTooltip>
      )}
      {/* SZTU 个性化样式 */}
      {isPc && isSZTUShared && (
        <>
          <Flex
            flexDir={'column'}
            w={'100%'}
            justifyContent={'center'}
            alignItems={'center'}
            gap={2}
            padding={'0 20px'}
            marginTop={'20px'}
          >
            <Button
              variant={'whitePrimary'}
              flex={['0 0 auto', 1]}
              w={'100%'}
              px={6}
              color={'primary.600'}
              borderRadius={'xl'}
              leftIcon={
                <MyImage
                  src="https://sztu-project.oss-rg-china-mainland.aliyuncs.com/sztu-FastGPT/sztu%20favicon.png"
                  w="16px"
                  objectFit="cover"
                  borderRadius="none"
                />
              }
              overflow={'hidden'}
              onClick={() => {
                location.href = 'https://www.sztu.edu.cn';
              }}
            >
              {'深圳技术大学'}
            </Button>
            <Button
              variant={'whitePrimary'}
              flex={['0 0 auto', 1]}
              w={'100%'}
              px={6}
              color={'primary.600'}
              borderRadius={'xl'}
              leftIcon={<MyIcon name={'core/app/aiLight'} w={'16px'} />}
              overflow={'hidden'}
              onClick={() => {
                location.href = 'https://ai.sztu.edu.cn/agent';
              }}
            >
              {'智能体广场'}
            </Button>
            <Button
              variant={'whitePrimary'}
              flex={['0 0 auto', 1]}
              w={'100%'}
              px={6}
              color={'primary.600'}
              borderRadius={'xl'}
              leftIcon={
                <MyImage
                  src="https://sztu-project.oss-rg-china-mainland.aliyuncs.com/sztu-FastGPT/5.png"
                  w="16px"
                  objectFit="cover"
                  borderRadius="none"
                />
              }
              overflow={'hidden'}
              onClick={() => {
                location.href = 'https://nbw.sztu.edu.cn';
              }}
            >
              {'深技大内部网'}
            </Button>
            <Button
              variant={'whitePrimary'}
              flex={['0 0 auto', 1]}
              w={'100%'}
              px={6}
              color={'primary.600'}
              borderRadius={'xl'}
              leftIcon={
                <MyImage
                  src="https://sztu-project.oss-rg-china-mainland.aliyuncs.com/sztu-FastGPT/OA%E7%B3%BB%E7%BB%9F.png"
                  w="16px"
                  objectFit="cover"
                  borderRadius="none"
                />
              }
              overflow={'hidden'}
              onClick={() => {
                location.href =
                  'https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain?entityId=oa';
              }}
            >
              {'深技大OA系统'}
            </Button>
          </Flex>
          <Divider marginTop={5} />
        </>
      )}

      {/* menu */}
      <Flex
        w={'100%'}
        px={[2, 5]}
        h={'36px'}
        my={5}
        justify={['space-between', '']}
        alignItems={'center'}
      >
        {!isPc && (
          <Flex height={'100%'} align={'center'} justify={'center'}>
            <MyIcon ml={2} name="core/chat/sideLine" />
            <Box ml={2} fontWeight={'bold'}>
              {t('common:core.chat.History')}
            </Box>
          </Flex>
        )}

        <Button
          variant={'whitePrimary'}
          flex={['0 0 auto', 1]}
          h={'100%'}
          px={6}
          color={'primary.600'}
          borderRadius={'xl'}
          leftIcon={<MyIcon name={'core/chat/chatLight'} w={'16px'} />}
          overflow={'hidden'}
          onClick={() => {
            onChangeChatId();
            setCiteModalData(undefined);
          }}
        >
          {t('common:core.chat.New Chat')}
        </Button>
        {/* Clear */}
        {isPc && histories.length > 0 && (
          <PopoverConfirm
            Trigger={
              <Box ml={3} h={'100%'}>
                <IconButton
                  variant={'whiteDanger'}
                  size={'mdSquare'}
                  aria-label={''}
                  borderRadius={'50%'}
                  icon={<MyIcon name={'common/clearLight'} w={'16px'} />}
                />
              </Box>
            }
            type="delete"
            content={confirmClearText}
            onConfirm={() => onClearHistory()}
          />
        )}
      </Flex>

      <ScrollData flex={'1 0 0'} h={0} px={[2, 5]} overflow={'overlay'}>
        {/* chat history */}
        <>
          {concatHistory.map((item, i) => (
            <Flex
              position={'relative'}
              key={item.id}
              alignItems={'center'}
              px={4}
              h={'44px'}
              cursor={'pointer'}
              userSelect={'none'}
              borderRadius={'md'}
              fontSize={'sm'}
              _hover={{
                bg: 'myGray.50',
                '& .more': {
                  display: 'block'
                },
                '& .time': {
                  display: isPc ? 'none' : 'block'
                }
              }}
              bg={item.top ? '#E6F6F6 !important' : ''}
              {...(item.id === activeChatId
                ? {
                    backgroundColor: 'primary.50 !important',
                    color: 'primary.600'
                  }
                : {
                    onClick: () => {
                      onChangeChatId(item.id);
                      setCiteModalData(undefined);
                    }
                  })}
              {...(i !== concatHistory.length - 1 && {
                mb: '8px'
              })}
            >
              <MyIcon
                name={item.id === activeChatId ? 'core/chat/chatFill' : 'core/chat/chatLight'}
                w={'16px'}
              />
              <Box flex={'1 0 0'} ml={3} className="textEllipsis">
                {item.customTitle || item.title}
              </Box>
              {!!item.id && (
                <Flex gap={2} alignItems={'center'}>
                  <Box
                    className="time"
                    display={'block'}
                    fontWeight={'400'}
                    fontSize={'mini'}
                    color={'myGray.500'}
                  >
                    {t(formatTimeToChatTime(item.updateTime) as any).replace('#', ':')}
                  </Box>
                  <Box className="more" display={['block', 'none']}>
                    <MyMenu
                      Button={
                        <IconButton
                          size={'xs'}
                          variant={'whiteBase'}
                          icon={<MyIcon name={'more'} w={'14px'} p={1} />}
                          aria-label={''}
                        />
                      }
                      menuList={[
                        {
                          children: [
                            {
                              label: item.top
                                ? t('common:core.chat.Unpin')
                                : t('common:core.chat.Pin'),
                              icon: 'core/chat/setTopLight',
                              onClick: () => {
                                onUpdateHistory({
                                  chatId: item.id,
                                  top: !item.top
                                });
                              }
                            },

                            {
                              label: t('common:custom_title'),
                              icon: 'common/customTitleLight',
                              onClick: () => {
                                onOpenModal({
                                  defaultVal: item.customTitle || item.title,
                                  onSuccess: (e) =>
                                    onUpdateHistory({
                                      chatId: item.id,
                                      customTitle: e
                                    })
                                });
                              }
                            },
                            {
                              label: t('common:Delete'),
                              icon: 'delete',
                              onClick: () => {
                                onDelHistory(item.id);
                                if (item.id === activeChatId) {
                                  onChangeChatId();
                                  setCiteModalData(undefined);
                                }
                              },
                              type: 'danger'
                            }
                          ]
                        }
                      ]}
                    />
                  </Box>
                </Flex>
              )}
            </Flex>
          ))}
        </>
      </ScrollData>
      {/* SZTU 个人信息 */}
      {isSZTUShared && <SZTUChatUserInfoBox />}
      {/* exec */}
      {!isPc && !!canRouteToDetail && (
        <Flex
          mt={2}
          borderTop={theme.borders.base}
          alignItems={'center'}
          cursor={'pointer'}
          p={3}
          onClick={() => router.push('/dashboard/apps')}
        >
          <IconButton
            mr={3}
            icon={<MyIcon name={'common/backFill'} w={'18px'} color={'primary.500'} />}
            bg={'white'}
            boxShadow={'1px 1px 9px rgba(0,0,0,0.15)'}
            size={'smSquare'}
            borderRadius={'50%'}
            aria-label={''}
          />
          {t('common:core.chat.Exit Chat')}
        </Flex>
      )}
      <EditTitleModal />
    </MyBox>
  );
};

export default ChatHistorySlider;
